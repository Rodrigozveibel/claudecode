import { Request, Response, NextFunction } from 'express';
import * as reservationsService from './reservations.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { ReservationStatus } from '@prisma/client';

export async function checkAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const checkIn = new Date(req.query.checkIn as string);
    const checkOut = new Date(req.query.checkOut as string);
    const adults = Number(req.query.adults) || 1;
    const children = Number(req.query.children) || 0;

    const availability = await reservationsService.checkAvailability(
      propertyId, checkIn, checkOut, adults, children
    );
    successResponse(res, availability);
  } catch (err) {
    next(err);
  }
}

export async function calculatePrice(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomTypeId, checkIn, checkOut } = req.query;
    const pricing = await reservationsService.calculatePrice(
      roomTypeId as string,
      new Date(checkIn as string),
      new Date(checkOut as string)
    );
    successResponse(res, pricing);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { reservations, total } = await reservationsService.getAll(propertyId, {
      status: req.query.status as ReservationStatus | undefined,
      page,
      limit,
      guestId: req.query.guestId as string | undefined,
      checkIn: req.query.checkIn as string | undefined,
      checkOut: req.query.checkOut as string | undefined,
    });
    paginatedResponse(res, reservations, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const reservation = await reservationsService.getById(req.params.id);
    successResponse(res, reservation);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const reservation = await reservationsService.create({
      ...req.body,
      createdBy: req.user?.id,
    });
    successResponse(res, reservation, 'Reservation created', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const reservation = await reservationsService.update(req.params.id, req.body);
    successResponse(res, reservation, 'Reservation updated');
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = req.body;
    const reservation = await reservationsService.cancel(req.params.id, reason);
    successResponse(res, reservation, 'Reservation cancelled');
  } catch (err) {
    next(err);
  }
}

export async function getTodayArrivals(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const arrivals = await reservationsService.getTodayArrivals(propertyId);
    successResponse(res, arrivals);
  } catch (err) {
    next(err);
  }
}

export async function getTodayDepartures(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const departures = await reservationsService.getTodayDepartures(propertyId);
    successResponse(res, departures);
  } catch (err) {
    next(err);
  }
}
