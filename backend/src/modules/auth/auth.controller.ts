import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    successResponse(res, result, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.forgotPassword(req.body);
    successResponse(res, null, 'If the email exists, a reset link has been sent');
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.resetPassword(req.body);
    successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.changePassword(req.user!.id, req.body);
    successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getProfile(req.user!.id);
    successResponse(res, user, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    successResponse(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
}
