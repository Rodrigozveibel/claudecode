import { Response, NextFunction } from 'express';
import * as checkinService from './checkin.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function checkIn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reservationId, roomId } = req.body;
    const result = await checkinService.checkIn(reservationId, roomId, req.user!.id);
    successResponse(res, result, 'Guest checked in successfully');
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await checkinService.checkOut(req.params.reservationId, req.user!.id);
    successResponse(res, result, 'Guest checked out successfully');
  } catch (error) {
    next(error);
  }
}

export async function getCurrentGuests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const guests = await checkinService.getCurrentGuests(propertyId);
    successResponse(res, guests);
  } catch (error) {
    next(error);
  }
}
