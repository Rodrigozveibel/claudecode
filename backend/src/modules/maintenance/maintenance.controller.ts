import { Response, NextFunction } from 'express';
import * as maintenanceService from './maintenance.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function createMaintenanceRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const request = await maintenanceService.createMaintenanceRequest({
      ...req.body,
      propertyId,
      reportedBy: req.user?.id,
    });
    successResponse(res, request, 'Maintenance request created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await maintenanceService.getMaintenanceRequests(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceRequestById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await maintenanceService.getMaintenanceRequestById(req.params.id);
    successResponse(res, request);
  } catch (error) {
    next(error);
  }
}

export async function updateMaintenanceRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await maintenanceService.updateMaintenanceRequest(req.params.id, req.body);
    successResponse(res, request, 'Maintenance request updated');
  } catch (error) {
    next(error);
  }
}

export async function assignMaintenanceRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await maintenanceService.assignMaintenanceRequest(req.params.id, req.body.assignedTo);
    successResponse(res, request, 'Maintenance request assigned');
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceHistoryByRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit } = await maintenanceService.getMaintenanceHistoryByRoom(req.params.roomId, req);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const startDate = new Date(req.query.startDate as string || new Date().setDate(1));
    const endDate = new Date(req.query.endDate as string || new Date());
    const report = await maintenanceService.getMaintenanceReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}
