import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const suppliersRouter = Router();
suppliersRouter.use(authenticate, requireRole("AGENT", "ADMIN"));

suppliersRouter.get("/", async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  res.json(suppliers);
});

const createSupplierSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  location: z.string().min(2),
});

// Lets an agent add a new supplier on the fly while quoting a request,
// rather than being blocked on a separate admin-only supplier setup step.
suppliersRouter.post("/", async (req, res) => {
  const parsed = createSupplierSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a supplier name, category, and location." });
  const supplier = await prisma.supplier.create({ data: parsed.data });
  res.status(201).json(supplier);
});
