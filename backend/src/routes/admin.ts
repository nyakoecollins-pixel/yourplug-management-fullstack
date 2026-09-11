import { Router } from "express";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

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
