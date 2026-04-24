import { Response, NextFunction } from 'express';
import * as roomsService from './rooms.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { RoomStatus } from '@prisma/client';

export async function createRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const room = await roomsService.createRoom({ ...req.body, propertyId });
    successResponse(res, room, 'Room created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getRooms(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await roomsService.getRooms(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getRoomById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = await roomsService.getRoomById(req.params.id);
    successResponse(res, room);
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = await roomsService.updateRoom(req.params.id, req.body);
    successResponse(res, room, 'Room updated');
  } catch (error) {
    next(error);
  }
}

export async function updateRoomStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = await roomsService.updateRoomStatus(req.params.id, req.body.status as RoomStatus);
    successResponse(res, room, 'Room status updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await roomsService.deleteRoom(req.params.id);
    successResponse(res, null, 'Room deactivated');
  } catch (error) {
    next(error);
  }
}

export async function getRoomAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { checkIn, checkOut } = req.query;
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const rooms = await roomsService.getRoomAvailability(
      propertyId,
      new Date(checkIn as string),
      new Date(checkOut as string)
    );
    successResponse(res, rooms);
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomIds, status } = req.body;
    const result = await roomsService.bulkUpdateStatus(roomIds, status as RoomStatus);
    successResponse(res, result, `Updated ${result.count} rooms`);
  } catch (error) {
    next(error);
  }
}
