import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";

export const invoicesRouter = Router();
invoicesRouter.use(authenticate);

invoicesRouter.get("/mine", async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    where: { request: { customerId: req.user!.sub } },
    include: { request: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(invoices);
});

invoicesRouter.get("/", requireRole("AGENT", "ADMIN"), async (_req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: { request: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(invoices);
});

const SERVICE_FEE_RATE = 0.06;
const DEFAULT_DELIVERY_FEE = 800;

const createInvoiceSchema = z.object({
  requestId: z.string(),
  subtotal: z.number().int().positive().optional(), // override, if there's no recommended quote yet
  deliveryFee: z.number().int().nonnegative().optional(),
});

// Generates a real invoice for a request, from its recommended supplier quote
// (or a manually supplied subtotal), and moves the request to Awaiting Payment.
invoicesRouter.post("/", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid requestId." });

  const request = await prisma.procurementRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: { customer: true, quotes: { where: { recommended: true } } },
  });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const existing = await prisma.invoice.findFirst({ where: { requestId: request.id, status: { not: "CANCELLED" } } });
  if (existing) return res.status(409).json({ error: `An invoice already exists for this request (${existing.number}).` });

  const subtotal = parsed.data.subtotal ?? request.quotes[0]?.price;
  if (!subtotal) {
    return res.status(400).json({ error: "No recommended quote on this request — provide a subtotal manually." });
  }
  const deliveryFee = parsed.data.deliveryFee ?? DEFAULT_DELIVERY_FEE;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee + deliveryFee;

  const count = await prisma.invoice.count();
  const number = `INV-${String(1820 + count).padStart(6, "0")}`;
  const paymentReference = `YPM-${String(1820 + count).padStart(6, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      number, requestId: request.id, subtotal, serviceFee, deliveryFee, total,
      currency: request.currency, status: "SENT", paymentReference,
    },
  });

  await prisma.procurementRequest.update({ where: { id: request.id }, data: { status: "AWAITING_PAYMENT" } });
  await prisma.requestEvent.create({
    data: { requestId: request.id, label: `Invoice ${number} generated — KSh ${total.toLocaleString()}` },
  });
  await audit(req.user!.sub, "invoice.created", "Invoice", invoice.id);

  await notify({
    email: request.customer.email,
    phone: request.customer.phone,
    subject: `Invoice ${number} — ${request.item}`,
    html: `<p>Your invoice for ${request.item} (${request.ref}) is ready.</p>
           <p>Subtotal: KSh ${subtotal.toLocaleString()}<br/>
           Service fee: KSh ${serviceFee.toLocaleString()}<br/>
           Delivery: KSh ${deliveryFee.toLocaleString()}<br/>
           <b>Total: KSh ${total.toLocaleString()}</b></p>
           <p>Payment reference: ${paymentReference}. Pay via M-Pesa from your dashboard.</p>`,
    smsText: `YourPlug: Invoice ${number} for ${request.item} is ready — KSh ${total.toLocaleString()}. Pay from your dashboard. Ref: ${paymentReference}`,
  });

  res.status(201).json(invoice);
});
