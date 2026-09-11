import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  randomCode,
} from "../utils/jwt.js";
import { audit } from "../utils/audit.js";

export const authRouter = Router();

const REFRESH_COOKIE = "yp_refresh";
const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Check your details and try again.", details: parsed.error.flatten() });
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email or phone already exists." });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "CUSTOMER" },
  });

  // In production these codes are sent via a real email/SMS provider.
  // Here they are logged server-side so the flow can be demonstrated end to end.
  const emailCode = randomCode();
  const phoneCode = randomCode();
  await prisma.verificationCode.createMany({
    data: [
      { userId: user.id, channel: "email", code: emailCode, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
      { userId: user.id, channel: "phone", code: phoneCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    ],
  });
  console.log(`[verification] email code for ${email}: ${emailCode}`);
  console.log(`[verification] phone OTP for ${phone}: ${phoneCode}`);

  await audit(user.id, "user.registered", "User", user.id);

  res.status(201).json({
    message: "Account created. Check the server console for your demo verification codes.",
    userId: user.id,
  });
});

const verifySchema = z.object({
  userId: z.string(),
  channel: z.enum(["email", "phone"]),
  code: z.string().length(6),
});

authRouter.post("/verify", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid verification request." });
  const { userId, channel, code } = parsed.data;

  const record = await prisma.verificationCode.findFirst({
    where: { userId, channel, code, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return res.status(400).json({ error: "That code is invalid or has expired." });

  await prisma.verificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  await prisma.user.update({
    where: { id: userId },
    data: channel === "email" ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() },
  });

  res.json({ message: `${channel === "email" ? "Email" : "Phone number"} verified.` });
});

const loginSchema = z.object({
  identifier: z.string(), // email or phone
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter your email/phone and password." });
  const { identifier, password } = parsed.data;

  const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } });
  if (!user) return res.status(401).json({ error: "Incorrect email/phone or password." });

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: "Too many failed attempts. Try again later." });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failedLogins = user.failedLogins + 1;
    const lockedUntil = failedLogins >= LOCK_AFTER_ATTEMPTS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      : null;
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins, lockedUntil } });
    await audit(user.id, "login.failed", "User", user.id);
    return res.status(401).json({ error: "Incorrect email/phone or password." });
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });

  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshToken = signRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
  });

  await audit(user.id, "login.success", "User", user.id);

  res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ error: "No refresh token." });

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ error: "Refresh token invalid or expired." });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: "Refresh token invalid or expired." });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return res.status(401).json({ error: "Account no longer exists." });

  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  res.json({ accessToken });
});

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token) },
      data: { revokedAt: new Date() },
    });
  }
  res.clearCookie(REFRESH_COOKIE);
  res.json({ message: "Logged out." });
});
