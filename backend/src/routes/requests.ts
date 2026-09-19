import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";

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
  const isAdmin = req.user!.role === "ADMIN";
  const isAssignedAgent = req.user!.role === "AGENT" && request.agentId === req.user!.sub;
  if (!isOwner && !isAdmin && !isAssignedAgent) return res.status(403).json({ error: "You can't view this request." });

  res.json(request);
});

// Staff-only: full queue across all customers
requestsRouter.get("/", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const isAgent = req.user!.role === "AGENT";
  const requests = await prisma.procurementRequest.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(isAgent ? { agentId: req.user!.sub } : {}), // agents only ever see their own assignments
    },
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

const STATUS_MESSAGES: Record<string, string> = {
  UNDER_REVIEW: "Your request is now under review by our procurement team.",
  SUPPLIER_RESEARCH: "We're sourcing suppliers for your request.",
  QUOTATION_READY: "A quotation is ready for your review and approval.",
  AWAITING_APPROVAL: "We need your approval before proceeding — check your dashboard.",
  AWAITING_PAYMENT: "Your invoice is ready. Please complete payment to proceed.",
  PURCHASED: "Your item has been purchased and is being prepared.",
  DISPATCHED: "Your order has been dispatched.",
  IN_TRANSIT: "Your order is on its way.",
  DELIVERED: "Your order has been delivered.",
  COMPLETED: "Your procurement request is complete. Thank you for using YourPlug.",
  CANCELLED: "Your request has been cancelled.",
  ISSUE_REPORTED: "An issue has been logged on your request — our team will follow up.",
};

requestsRouter.patch("/:id/status", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status." });

  const before = await prisma.procurementRequest.findUnique({
    where: { id: req.params.id },
    include: { customer: true },
  });
  if (!before) return res.status(404).json({ error: "Request not found." });

  const request = await prisma.procurementRequest.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  });
  await prisma.requestEvent.create({
    data: { requestId: request.id, label: parsed.data.note || `Status changed to ${parsed.data.status}` },
  });
  await audit(req.user!.sub, "request.status_changed", "ProcurementRequest", request.id);

  const message = STATUS_MESSAGES[parsed.data.status];
  if (message) {
    await notify({
      email: before.customer.email,
      phone: before.customer.phone,
      subject: `Update on ${request.ref} — ${request.item}`,
      html: `<p>${message}</p><p>Reference: ${request.ref}</p>`,
      smsText: `YourPlug ${request.ref}: ${message}`,
    });
  }

  res.json(request);
});

// --- Messaging, scoped to a request ---
// Customers only ever see/post "customer"-visibility messages on their own request.
// Staff can see and post both "customer" and "internal" messages on any request.
// A customer can never receive an "internal" message, by construction below.

requestsRouter.get("/:id/messages", async (req, res) => {
  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const isOwner = request.customerId === req.user!.sub;
  const isStaff = req.user!.role === "AGENT" || req.user!.role === "ADMIN";
  if (!isOwner && !isStaff) return res.status(403).json({ error: "You can't view these messages." });

  const messages = await prisma.message.findMany({
    where: { requestId: req.params.id, ...(isStaff ? {} : { visibility: "customer" }) },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
  visibility: z.enum(["customer", "internal"]).default("customer"),
});

requestsRouter.post("/:id/messages", async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Message can't be empty." });

  const request = await prisma.procurementRequest.findUnique({
    where: { id: req.params.id },
    include: { customer: true, agent: true },
  });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const isOwner = request.customerId === req.user!.sub;
  const isStaff = req.user!.role === "AGENT" || req.user!.role === "ADMIN";
  if (!isOwner && !isStaff) return res.status(403).json({ error: "You can't message on this request." });

  // A customer can only ever create customer-visible messages — never internal notes,
  // regardless of what the client sends.
  const visibility = isStaff ? parsed.data.visibility : "customer";

  const message = await prisma.message.create({
    data: { requestId: request.id, senderId: req.user!.sub, visibility, body: parsed.data.body },
    include: { sender: true },
  });
  await audit(req.user!.sub, "message.sent", "ProcurementRequest", request.id);

  // Notify the other side, but never leak an internal note to the customer.
  if (isStaff && visibility === "customer") {
    await notify({
      email: request.customer.email,
      phone: request.customer.phone,
      subject: `New message on ${request.ref}`,
      html: `<p>Your YourPlug agent sent an update on ${request.ref}:</p><p>${parsed.data.body}</p>`,
      smsText: `YourPlug ${request.ref}: ${parsed.data.body}`.slice(0, 160),
    });
  } else if (isOwner && request.agent?.email) {
    await notify({
      email: request.agent.email,
      subject: `Customer message on ${request.ref}`,
      html: `<p>Customer message on ${request.ref}:</p><p>${parsed.data.body}</p>`,
      smsText: "",
    });
  }

  res.status(201).json(message);
});

// --- Supplier quotes on a request ---

const quoteSchema = z.object({
  supplierId: z.string(),
  price: z.number().int().positive(),
  deliveryEstimate: z.string().min(2),
  warrantyTerms: z.string().min(2),
  recommended: z.boolean().default(false),
});

requestsRouter.post("/:id/quotes", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the quote details.", details: parsed.error.flatten() });

  const request = await prisma.procurementRequest.findUnique({
    where: { id: req.params.id },
    include: { customer: true },
  });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const supplier = await prisma.supplier.findUnique({ where: { id: parsed.data.supplierId } });
  if (!supplier) return res.status(404).json({ error: "Supplier not found." });

  // Transparent, simple scoring from the supplier's own track record —
  // the full price/reliability/spec-match weighting from the spec applies
  // once multiple quotes exist to compare against each other.
  const score = Math.round(supplier.reliability * 0.5 + supplier.delivery * 0.3 + supplier.warranty * 0.2);

  if (parsed.data.recommended) {
    await prisma.supplierQuote.updateMany({ where: { requestId: request.id }, data: { recommended: false } });
  }

  const quote = await prisma.supplierQuote.create({
    data: {
      requestId: request.id,
      supplierId: supplier.id,
      price: parsed.data.price,
      deliveryEstimate: parsed.data.deliveryEstimate,
      warrantyTerms: parsed.data.warrantyTerms,
      recommended: parsed.data.recommended,
      score,
    },
    include: { supplier: true },
  });

  await prisma.requestEvent.create({
    data: { requestId: request.id, label: `Quote received from ${supplier.name} — KSh ${parsed.data.price.toLocaleString()}` },
  });

  if (parsed.data.recommended) {
    await prisma.procurementRequest.update({ where: { id: request.id }, data: { status: "AWAITING_APPROVAL" } });
    await prisma.requestEvent.create({
      data: { requestId: request.id, label: `${supplier.name} recommended — awaiting customer approval` },
    });
    await notify({
      email: request.customer.email,
      phone: request.customer.phone,
      subject: `A quote is ready for ${request.ref}`,
      html: `<p>We found a supplier for ${request.item}: ${supplier.name} at KSh ${parsed.data.price.toLocaleString()}.</p><p>Review and approve it from your dashboard.</p>`,
      smsText: `YourPlug ${request.ref}: quote ready from ${supplier.name} — KSh ${parsed.data.price.toLocaleString()}. Review in your dashboard.`,
    });
  } else if (request.status === "SUBMITTED" || request.status === "UNDER_REVIEW" || request.status === "SUPPLIER_RESEARCH") {
    await prisma.procurementRequest.update({ where: { id: request.id }, data: { status: "QUOTATION_READY" } });
  }

  await audit(req.user!.sub, "quote.created", "SupplierQuote", quote.id);
  res.status(201).json(quote);
});
