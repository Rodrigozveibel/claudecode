import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UnauthorizedError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; role: string };
}

export function requireAuth(authService: AuthService) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }
    const token = header.slice('Bearer '.length);
    const payload = authService.verifyToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  };
}
