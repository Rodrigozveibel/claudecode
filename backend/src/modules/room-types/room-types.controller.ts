import { Response, NextFunction } from 'express';
import * as roomTypesService from './room-types.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function createRoomType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const roomType = await roomTypesService.createRoomType({ ...req.body, propertyId });
    successResponse(res, roomType, 'Room type created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getRoomTypes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await roomTypesService.getRoomTypes(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getRoomTypeById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomType = await roomTypesService.getRoomTypeById(req.params.id);
    successResponse(res, roomType);
  } catch (error) {
    next(error);
  }
}

export async function updateRoomType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomType = await roomTypesService.updateRoomType(req.params.id, req.body);
    successResponse(res, roomType, 'Room type updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteRoomType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await roomTypesService.deleteRoomType(req.params.id);
    successResponse(res, null, 'Room type deactivated');
  } catch (error) {
    next(error);
  }
}

export async function getPricingCalendar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const calendar = await roomTypesService.getPricingCalendar(req.params.id, start, end);
    successResponse(res, calendar);
  } catch (error) {
    next(error);
  }
}
