import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

export const requestsRouter = Router();
requestsRouter.use(authenticate);

async function nextRef() {
  const now = new Date();
  const prefix = `YPM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.procurementRequest.count({ where: { ref: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

const createSchema = z.object({
  item: z.string().min(2),
  description: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  budget: z.number().int().positive().optional(),
  currency: z.string().default("KES"),
  urgency: z.enum(["NORMAL", "HIGH", "URGENT", "EMERGENCY"]).default("NORMAL"),
  scope: z.enum(["LOCAL", "INTERNATIONAL"]).default("LOCAL"),
  deliveryAddress: z.string().optional(),
});

requestsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Check the request details.", details: parsed.error.flatten() });
  }
  const ref = await nextRef();
  const request = await prisma.procurementRequest.create({
    data: { ...parsed.data, ref, customerId: req.user!.sub, status: "SUBMITTED" },
  });
  await prisma.requestEvent.create({
    data: { requestId: request.id, label: "Customer submitted request" },
  });
  await audit(req.user!.sub, "request.created", "ProcurementRequest", request.id);
  res.status(201).json(request);
});

requestsRouter.get("/mine", async (req, res) => {
  const requests = await prisma.procurementRequest.findMany({
    where: { customerId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    include: { quotes: { include: { supplier: true } }, events: true, agent: true },
  });
  res.json(requests);
});

requestsRouter.get("/:id", async (req, res) => {
  const request = await prisma.procurementRequest.findUnique({
    where: { id: req.params.id },
    include: { quotes: { include: { supplier: true } }, events: true, agent: true, customer: true },
  });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const isOwner = request.customerId === req.user!.sub;
  const isStaff = req.user!.role === "AGENT" || req.user!.role === "ADMIN";
  if (!isOwner && !isStaff) return res.status(403).json({ error: "You can't view this request." });

  res.json(request);
});

// Staff-only: full queue across all customers
requestsRouter.get("/", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const requests = await prisma.procurementRequest.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: { customer: true, agent: true, quotes: true },
  });
  res.json(requests);
});

const statusSchema = z.object({
  status: z.enum([
    "SUBMITTED", "UNDER_REVIEW", "SUPPLIER_RESEARCH", "QUOTATION_READY",
    "AWAITING_APPROVAL", "AWAITING_PAYMENT", "PURCHASED", "DISPATCHED",
    "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED", "ISSUE_REPORTED",
  ]),
  note: z.string().optional(),
});

requestsRouter.patch("/:id/status", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status." });

  const before = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: "Request not found." });

  const request = await prisma.procurementRequest.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  });
  await prisma.requestEvent.create({
    data: { requestId: request.id, label: parsed.data.note || `Status changed to ${parsed.data.status}` },
  });
  await audit(req.user!.sub, "request.status_changed", "ProcurementRequest", request.id);
  res.json(request);
});
