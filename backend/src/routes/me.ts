import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

export const meRouter = Router();
meRouter.use(authenticate);

meRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub }, include: { organization: true } });
  if (!user) return res.status(404).json({ error: "Account not found." });
  res.json({
    id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role,
    accountType: user.accountType, organization: user.organization,
    emailVerified: Boolean(user.emailVerifiedAt), phoneVerified: Boolean(user.phoneVerifiedAt),
  });
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
});

meRouter.patch("/", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the details you entered." });
  if (Object.keys(parsed.data).length === 0) return res.status(400).json({ error: "Nothing to update." });

  const before = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!before) return res.status(404).json({ error: "Account not found." });

  // Email/phone must stay unique across all accounts.
  if (parsed.data.email || parsed.data.phone) {
    const clash = await prisma.user.findFirst({
      where: {
        id: { not: req.user!.sub },
        OR: [
          parsed.data.email ? { email: parsed.data.email } : undefined,
          parsed.data.phone ? { phone: parsed.data.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (clash) return res.status(409).json({ error: "That email or phone number is already in use by another account." });
  }

  // Changing email or phone resets its verified status — it's a new, unconfirmed address.
  const data: any = { ...parsed.data };
  if (parsed.data.email && parsed.data.email !== before.email) data.emailVerifiedAt = null;
  if (parsed.data.phone && parsed.data.phone !== before.phone) data.phoneVerifiedAt = null;

  const updated = await prisma.user.update({ where: { id: req.user!.sub }, data });
  await audit(req.user!.sub, "profile.updated", "User", updated.id);

  res.json({
    id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, role: updated.role,
    emailVerified: Boolean(updated.emailVerifiedAt), phoneVerified: Boolean(updated.phoneVerifiedAt),
  });
});
