import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing access token" });
  }
  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

export function requireRole(...roles: Array<"CUSTOMER" | "AGENT" | "ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do that" });
    }
    next();
  };
}
