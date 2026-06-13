import { Request, Response, NextFunction } from 'express';
import * as housekeepingService from './housekeeping.service';
import { successResponse } from '../../utils/response';
import { HousekeepingTaskStatus } from '@prisma/client';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const tasks = await housekeepingService.getTasks(propertyId, {
      status: req.query.status as HousekeepingTaskStatus | undefined,
      date: req.query.date as string | undefined,
      assignedToId: req.query.assignedToId as string | undefined,
      roomId: req.query.roomId as string | undefined,
    });
    successResponse(res, tasks);
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await housekeepingService.getTask(req.params.id);
    successResponse(res, task);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await housekeepingService.createTask(req.body);
    successResponse(res, task, 'Task created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, notes } = req.body;
    const task = await housekeepingService.updateTaskStatus(
      req.params.id,
      status as HousekeepingTaskStatus,
      notes
    );
    successResponse(res, task, 'Task status updated');
  } catch (err) {
    next(err);
  }
}

export async function assignTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { assignedToId } = req.body;
    const task = await housekeepingService.assignTask(req.params.id, assignedToId);
    successResponse(res, task, 'Task assigned');
  } catch (err) {
    next(err);
  }
}

export async function getDailyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const report = await housekeepingService.getDailyReport(propertyId, date);
    successResponse(res, report);
  } catch (err) {
    next(err);
  }
}
