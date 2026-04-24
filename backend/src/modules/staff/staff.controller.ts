import { Response, NextFunction } from 'express';
import * as staffService from './staff.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

export async function getStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await staffService.getStaff(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getStaffMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await staffService.getStaffMember(req.params.id);
    successResponse(res, staff);
  } catch (error) {
    next(error);
  }
}

export async function createStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await staffService.createStaff(req.body);
    successResponse(res, staff, 'Staff member created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await staffService.updateStaff(req.params.id, req.body);
    successResponse(res, staff, 'Staff member updated');
  } catch (error) {
    next(error);
  }
}

export async function deactivateStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await staffService.deactivateStaff(req.params.id);
    successResponse(res, null, 'Staff member deactivated');
  } catch (error) {
    next(error);
  }
}

export async function assignRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await staffService.assignRole(req.params.id, req.body.role as UserRole);
    successResponse(res, staff, 'Role assigned');
  } catch (error) {
    next(error);
  }
}

export async function getStaffTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tasks = await staffService.getStaffTasks(req.params.id);
    successResponse(res, tasks);
  } catch (error) {
    next(error);
  }
}
