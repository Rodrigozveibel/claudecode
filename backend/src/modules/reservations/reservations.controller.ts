import { Response, NextFunction } from 'express';
import * as reservationsService from './reservations.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function checkAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { checkIn, checkOut, adults = '1', children = '0', propertyId } = req.query;
    const pid = propertyId as string || req.user?.propertyId!;
    const available = await reservationsService.checkAvailability(
      pid,
      new Date(checkIn as string),
      new Date(checkOut as string),
      parseInt(adults as string),
      parseInt(children as string)
    );
    successResponse(res, available);
  } catch (error) {
    next(error);
  }
}

export async function calculatePrice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomTypeId, checkIn, checkOut, addons } = req.body;
    const pricing = await reservationsService.calculatePrice(
      roomTypeId,
      new Date(checkIn),
      new Date(checkOut),
      addons
    );
    successResponse(res, pricing);
  } catch (error) {
    next(error);
  }
}

export async function createReservation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const reservation = await reservationsService.createReservation({
      ...req.body,
      propertyId,
      createdBy: req.user?.id,
      checkIn: new Date(req.body.checkIn),
      checkOut: new Date(req.body.checkOut),
    });
    successResponse(res, reservation, 'Reservation created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getReservations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await reservationsService.getReservations(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getReservationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const reservation = await reservationsService.getReservationById(req.params.id);
    successResponse(res, reservation);
  } catch (error) {
    next(error);
  }
}

export async function getReservationByConfirmation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const reservation = await reservationsService.getReservationByConfirmation(req.params.confirmationNumber);
    successResponse(res, reservation);
  } catch (error) {
    next(error);
  }
}

export async function updateReservation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const reservation = await reservationsService.updateReservation(req.params.id, req.body);
    successResponse(res, reservation, 'Reservation updated');
  } catch (error) {
    next(error);
  }
}

export async function cancelReservation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const reservation = await reservationsService.cancelReservation(req.params.id, req.body.reason);
    successResponse(res, reservation, 'Reservation cancelled');
  } catch (error) {
    next(error);
  }
}
