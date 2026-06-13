import { Request, Response, NextFunction } from 'express';
import * as checkinService from './checkin.service';
import { successResponse } from '../../utils/response';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const { reservationId } = req.body;
    const result = await checkinService.checkIn(reservationId, req.user?.id || 'system');
    successResponse(res, result, 'Check-in successful');
  } catch (err) {
    next(err);
  }
}

export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    const { reservationId } = req.body;
    const result = await checkinService.checkOut(reservationId, req.user?.id || 'system');
    successResponse(res, result, 'Check-out successful');
  } catch (err) {
    next(err);
  }
}

export async function getCurrentGuests(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const guests = await checkinService.getCurrentGuests(propertyId);
    successResponse(res, guests);
  } catch (err) {
    next(err);
  }
}
