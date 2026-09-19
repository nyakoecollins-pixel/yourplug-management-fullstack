import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

export const supplierPortalRouter = Router();
supplierPortalRouter.use(authenticate, requireRole("SUPPLIER"));

async function getOwnSupplierId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.supplierId) throw new Error("No supplier profile linked to this account.");
  return user.supplierId;
}

// Requests currently open for sourcing — deliberately excludes customer name,
// contact details, and any other customer PII. Suppliers see only what they
// need to quote: the item itself.
supplierPortalRouter.get("/open-requests", async (_req, res) => {
  const requests = await prisma.procurementRequest.findMany({
    where: { status: { in: ["SUPPLIER_RESEARCH", "QUOTATION_READY"] } },
    select: { id: true, ref: true, item: true, description: true, quantity: true, urgency: true, scope: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

const quoteSchema = z.object({
  price: z.number().int().positive(),
  deliveryEstimate: z.string().min(1),
  warrantyTerms: z.string().min(1),
});

supplierPortalRouter.post("/requests/:id/quote", async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check your quote details." });

  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found." });
  if (!["SUPPLIER_RESEARCH", "QUOTATION_READY"].includes(request.status)) {
    return res.status(409).json({ error: "This request is no longer open for quotes." });
  }

  const supplierId = await getOwnSupplierId(req.user!.sub);
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return res.status(404).json({ error: "Supplier profile not found." });

  const existing = await prisma.supplierQuote.findFirst({ where: { requestId: request.id, supplierId } });
  if (existing) return res.status(409).json({ error: "You've already quoted on this request." });

  // Same transparent scoring basis used everywhere else — reliability, delivery,
  // warranty track record, not just price.
  const score = Math.round((supplier.reliability + supplier.delivery + supplier.warranty) / 3);

  const quote = await prisma.supplierQuote.create({
    data: { requestId: request.id, supplierId, price: parsed.data.price, deliveryEstimate: parsed.data.deliveryEstimate, warrantyTerms: parsed.data.warrantyTerms, score },
  });

  await prisma.requestEvent.create({ data: { requestId: request.id, label: `Quotation received from ${supplier.name}` } });
  await prisma.procurementRequest.update({ where: { id: request.id }, data: { status: "QUOTATION_READY" } });
  await audit(req.user!.sub, "quote.submitted", "SupplierQuote", quote.id);

  res.status(201).json(quote);
});

supplierPortalRouter.get("/quotes/mine", async (req, res) => {
  const supplierId = await getOwnSupplierId(req.user!.sub);
  const quotes = await prisma.supplierQuote.findMany({
    where: { supplierId },
    include: { request: { select: { ref: true, item: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(quotes);
});

supplierPortalRouter.get("/profile", async (req, res) => {
  const supplierId = await getOwnSupplierId(req.user!.sub);
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  res.json(supplier);
});

const supplierProfileSchema = z.object({
  category: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  website: z.string().optional(),
});

supplierPortalRouter.patch("/profile", async (req, res) => {
  const parsed = supplierProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check your details." });
  const supplierId = await getOwnSupplierId(req.user!.sub);
  const updated = await prisma.supplier.update({ where: { id: supplierId }, data: parsed.data });
  await audit(req.user!.sub, "supplier_profile.updated", "Supplier", supplierId);
  res.json(updated);
});
