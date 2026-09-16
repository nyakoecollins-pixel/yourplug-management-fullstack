import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";

export const fulfillmentRouter = Router();
fulfillmentRouter.use(authenticate);

async function nextPoNumber() {
  const count = await prisma.purchaseOrder.count();
  return `PO-${String(3300 + count).padStart(5, "0")}`;
}

const poSchema = z.object({
  supplierId: z.string().optional(),
  itemDescription: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().positive(),
  deliveryInstructions: z.string().optional(),
  paymentTerms: z.string().optional(),
  expectedDeliveryDate: z.string().optional(), // ISO date string
  notes: z.string().optional(),
});

fulfillmentRouter.post("/requests/:id/purchase-order", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const parsed = poSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the purchase order details.", details: parsed.error.flatten() });

  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const poNumber = await nextPoNumber();
  const totalAmount = parsed.data.quantity * parsed.data.unitPrice;

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber, requestId: request.id, supplierId: parsed.data.supplierId,
      itemDescription: parsed.data.itemDescription, quantity: parsed.data.quantity, unitPrice: parsed.data.unitPrice,
      totalAmount, deliveryInstructions: parsed.data.deliveryInstructions, paymentTerms: parsed.data.paymentTerms,
      expectedDeliveryDate: parsed.data.expectedDeliveryDate ? new Date(parsed.data.expectedDeliveryDate) : undefined,
      notes: parsed.data.notes,
    },
  });

  await prisma.requestEvent.create({ data: { requestId: request.id, label: `Purchase order ${poNumber} created` } });
  await audit(req.user!.sub, "purchase_order.created", "PurchaseOrder", po.id);

  res.status(201).json(po);
});

fulfillmentRouter.get("/requests/:id/purchase-order", async (req, res) => {
  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found." });
  if (request.customerId !== req.user!.sub && req.user!.role === "CUSTOMER") {
    return res.status(403).json({ error: "You can't view this." });
  }
  const po = await prisma.purchaseOrder.findFirst({ where: { requestId: req.params.id }, include: { supplier: true }, orderBy: { createdAt: "desc" } });
  res.json(po);
});

const deliverySchema = z.object({
  provider: z.string().min(1),
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  courierPhone: z.string().optional(),
  pickupLocation: z.string().optional(),
  destination: z.string().optional(),
  estimatedDelivery: z.string().optional(),
});

const DELIVERY_STATUS_MESSAGES: Record<string, { requestStatus: string; message: string }> = {
  dispatched: { requestStatus: "DISPATCHED", message: "Your order has been dispatched and is on its way to the courier." },
  in_transit: { requestStatus: "IN_TRANSIT", message: "Your order is in transit." },
  delivered: { requestStatus: "DELIVERED", message: "Your order has been delivered." },
};

// Books (or updates) delivery — booking always starts a delivery as "dispatched".
fulfillmentRouter.post("/requests/:id/delivery", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const parsed = deliverySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the delivery details." });

  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id }, include: { customer: true } });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const delivery = await prisma.delivery.upsert({
    where: { requestId: request.id },
    update: { ...parsed.data, estimatedDelivery: parsed.data.estimatedDelivery ? new Date(parsed.data.estimatedDelivery) : undefined, status: "dispatched" },
    create: {
      requestId: request.id, provider: parsed.data.provider, trackingNumber: parsed.data.trackingNumber,
      courierName: parsed.data.courierName, courierPhone: parsed.data.courierPhone, pickupLocation: parsed.data.pickupLocation,
      destination: parsed.data.destination, estimatedDelivery: parsed.data.estimatedDelivery ? new Date(parsed.data.estimatedDelivery) : undefined,
      status: "dispatched",
    },
  });

  await prisma.procurementRequest.update({ where: { id: request.id }, data: { status: "DISPATCHED" } });
  await prisma.requestEvent.create({ data: { requestId: request.id, label: `Delivery booked via ${parsed.data.provider}${parsed.data.trackingNumber ? ` — tracking ${parsed.data.trackingNumber}` : ""}` } });
  await audit(req.user!.sub, "delivery.booked", "Delivery", delivery.id);

  await notify({
    email: request.customer.email, phone: request.customer.phone,
    subject: `Your order is on its way — ${request.ref}`,
    html: `<p>Your order (${request.item}) has been dispatched via ${parsed.data.provider}.${parsed.data.trackingNumber ? ` Tracking number: ${parsed.data.trackingNumber}.` : ""}</p>`,
    smsText: `YourPlug ${request.ref}: dispatched via ${parsed.data.provider}.${parsed.data.trackingNumber ? ` Tracking: ${parsed.data.trackingNumber}` : ""}`,
  });

  res.status(201).json(delivery);
});

const statusUpdateSchema = z.object({ status: z.enum(["dispatched", "in_transit", "delivered"]) });

fulfillmentRouter.patch("/requests/:id/delivery/status", requireRole("AGENT", "ADMIN"), async (req, res) => {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid delivery status." });

  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id }, include: { customer: true } });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const delivery = await prisma.delivery.update({
    where: { requestId: req.params.id },
    data: { status: parsed.data.status, deliveredAt: parsed.data.status === "delivered" ? new Date() : undefined },
  });

  const meta = DELIVERY_STATUS_MESSAGES[parsed.data.status];
  await prisma.procurementRequest.update({
    where: { id: request.id },
    data: { status: (parsed.data.status === "delivered" ? "COMPLETED" : meta.requestStatus) as any },
  });
  await prisma.requestEvent.create({ data: { requestId: request.id, label: meta.message } });
  await audit(req.user!.sub, "delivery.status_changed", "Delivery", delivery.id);

  await notify({
    email: request.customer.email, phone: request.customer.phone,
    subject: `Update on ${request.ref}`,
    html: `<p>${meta.message}</p>`,
    smsText: `YourPlug ${request.ref}: ${meta.message}`,
  });

  res.json(delivery);
});

fulfillmentRouter.get("/requests/:id/delivery", async (req, res) => {
  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found." });
  if (request.customerId !== req.user!.sub && req.user!.role === "CUSTOMER") {
    return res.status(403).json({ error: "You can't view this." });
  }
  const delivery = await prisma.delivery.findUnique({ where: { requestId: req.params.id } });
  res.json(delivery);
});
