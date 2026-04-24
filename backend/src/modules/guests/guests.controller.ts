import { Response, NextFunction } from 'express';
import * as guestsService from './guests.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function createGuest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const guest = await guestsService.createGuest({ ...req.body, propertyId });
    successResponse(res, guest, 'Guest created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getGuests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await guestsService.getGuests(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getGuestById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guest = await guestsService.getGuestById(req.params.id);
    successResponse(res, guest);
  } catch (error) {
    next(error);
  }
}

export async function updateGuest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guest = await guestsService.updateGuest(req.params.id, req.body);
    successResponse(res, guest, 'Guest updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteGuest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await guestsService.deleteGuest(req.params.id);
    successResponse(res, null, 'Guest deleted');
  } catch (error) {
    next(error);
  }
}

export async function blacklistGuest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guest = await guestsService.blacklistGuest(req.params.id);
    successResponse(res, guest, 'Guest blacklisted');
  } catch (error) {
    next(error);
  }
}

export async function unblacklistGuest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guest = await guestsService.unblacklistGuest(req.params.id);
    successResponse(res, guest, 'Guest removed from blacklist');
  } catch (error) {
    next(error);
  }
}

export async function getGuestHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit } = await guestsService.getGuestHistory(req.params.id, req);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getLoyaltyHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit } = await guestsService.getLoyaltyHistory(req.params.id, req);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function mergeDuplicates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { primaryId, duplicateIds } = req.body;
    const guest = await guestsService.mergeDuplicates(primaryId, duplicateIds);
    successResponse(res, guest, 'Guests merged successfully');
  } catch (error) {
    next(error);
  }
}
