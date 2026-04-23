import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/crypto';
import { errorResponse } from '../utils/response';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: JwtPayload & { id: string };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'No token provided', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, propertyId: true, isActive: true },
    });

    if (!user || !user.isActive) {
      errorResponse(res, 'User not found or inactive', 401);
      return;
    }

    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      propertyId: user.propertyId ?? undefined,
    };

    next();
  } catch (error) {
    errorResponse(res, 'Invalid or expired token', 401);
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}
