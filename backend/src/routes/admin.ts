import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import { hashPassword } from "../utils/password.js";
import { getDownloadUrl } from "../integrations/storage.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN"));

adminRouter.get("/metrics", async (_req, res) => {
  const [total, awaitingApproval, awaitingPayment, inTransit, completed] = await Promise.all([
    prisma.procurementRequest.count(),
    prisma.procurementRequest.count({ where: { status: "AWAITING_APPROVAL" } }),
    prisma.procurementRequest.count({ where: { status: "AWAITING_PAYMENT" } }),
    prisma.procurementRequest.count({ where: { status: "IN_TRANSIT" } }),
    prisma.procurementRequest.count({ where: { status: "COMPLETED" } }),
  ]);
  res.json({ total, awaitingApproval, awaitingPayment, inTransit, completed });
});

adminRouter.get("/audit-logs", async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });
  res.json(logs);
});

// --- Agent management ---

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

const createAgentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
});

adminRouter.post("/agents", async (req, res) => {
  const parsed = createAgentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid name, email, and phone." });

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: parsed.data.email }, { phone: parsed.data.phone }] } });
  if (existing) return res.status(409).json({ error: "An account with that email or phone already exists." });

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const agent = await prisma.user.create({
    data: { ...parsed.data, passwordHash, role: "AGENT", emailVerifiedAt: new Date(), phoneVerifiedAt: new Date() },
  });
  await audit(req.user!.sub, "agent.created", "User", agent.id);

  await notify({
    email: agent.email, phone: agent.phone,
    subject: "Your YourPlug agent account",
    html: `<p>You've been added as a YourPlug procurement agent.</p><p>Email: ${agent.email}<br/>Temporary password: <b>${tempPassword}</b></p><p>Log in and change your password as soon as possible.</p>`,
    smsText: `YourPlug: your agent account is ready. Email: ${agent.email} Temp password: ${tempPassword}`,
  });

  res.status(201).json({ id: agent.id, name: agent.name, email: agent.email, tempPassword });
});

adminRouter.get("/agents", async (_req, res) => {
  const agents = await prisma.user.findMany({ where: { role: "AGENT" }, orderBy: { createdAt: "desc" } });
  const withCounts = await Promise.all(agents.map(async (a: typeof agents[number]) => {
    const [active, completed] = await Promise.all([
      prisma.procurementRequest.count({ where: { agentId: a.id, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
      prisma.procurementRequest.count({ where: { agentId: a.id, status: "COMPLETED" } }),
    ]);
    return { id: a.id, name: a.name, email: a.email, phone: a.phone, createdAt: a.createdAt, active, completed };
  }));
  res.json(withCounts);
});

const assignSchema = z.object({ agentId: z.string() });

adminRouter.patch("/requests/:id/assign", async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid agentId." });

  const agent = await prisma.user.findFirst({ where: { id: parsed.data.agentId, role: "AGENT" } });
  if (!agent) return res.status(404).json({ error: "Agent not found." });

  const request = await prisma.procurementRequest.update({ where: { id: req.params.id }, data: { agentId: agent.id } });
  await prisma.requestEvent.create({ data: { requestId: request.id, label: `Assigned to agent ${agent.name}` } });
  await audit(req.user!.sub, "request.assigned", "ProcurementRequest", request.id);

  res.json(request);
});

// --- Document audit trail — every document across every request ---

adminRouter.get("/documents", async (_req, res) => {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { request: { select: { ref: true, item: true } }, uploadedBy: true },
  });
  res.json(documents.map((d: typeof documents[number]) => ({
    id: d.id, fileName: d.fileName, mimeType: d.mimeType, sizeBytes: d.sizeBytes, visibility: d.visibility,
    requestRef: d.request.ref, requestItem: d.request.item, uploadedBy: d.uploadedBy.name, createdAt: d.createdAt,
  })));
});

adminRouter.get("/documents/:id/download", async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: "Document not found." });
  try {
    const url = await getDownloadUrl(doc.storageKey);
    res.json({ url });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Couldn't generate a download link." });
  }
});
