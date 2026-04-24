import { Response, NextFunction } from 'express';
import * as housekeepingService from './housekeeping.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { HousekeepingTaskStatus } from '@prisma/client';

export async function getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await housekeepingService.getTasks(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const task = await housekeepingService.createTask({ ...req.body, propertyId });
    successResponse(res, task, 'Task created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateTaskStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, notes } = req.body;
    const task = await housekeepingService.updateTaskStatus(
      req.params.id,
      status as HousekeepingTaskStatus,
      notes,
      req.user?.id
    );
    successResponse(res, task, 'Task status updated');
  } catch (error) {
    next(error);
  }
}

export async function assignTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await housekeepingService.assignTask(req.params.id, req.body.assignedTo);
    successResponse(res, task, 'Task assigned');
  } catch (error) {
    next(error);
  }
}

export async function bulkAssignTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskIds, assignedTo } = req.body;
    const result = await housekeepingService.bulkAssignTasks(taskIds, assignedTo);
    successResponse(res, result, `Assigned ${result.count} tasks`);
  } catch (error) {
    next(error);
  }
}

export async function inspectRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { passed, notes } = req.body;
    const task = await housekeepingService.inspectRoom(req.params.id, req.user!.id, passed, notes);
    successResponse(res, task, 'Inspection recorded');
  } catch (error) {
    next(error);
  }
}

export async function getHousekeepingReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const report = await housekeepingService.getHousekeepingReport(propertyId, date);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}
