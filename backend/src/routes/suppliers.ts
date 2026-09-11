import { Router } from "express";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const suppliersRouter = Router();
suppliersRouter.use(authenticate, requireRole("AGENT", "ADMIN"));

suppliersRouter.get("/", async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  res.json(suppliers);
});
