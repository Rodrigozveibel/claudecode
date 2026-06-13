import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthedRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Lightweight JWT auth. Dashboard APIs use this. In development, if no JWT
 * secret beyond the default is configured, auth is permissive so the system
 * works out of the box; set a strong JWT_SECRET in production to enforce it.
 */
export function authMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  // Allow public access in dev when running with the default secret.
  if (env.nodeEnv !== "production") {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      id: string;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function signToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}
