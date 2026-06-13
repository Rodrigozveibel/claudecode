import { Request, Response, NextFunction } from 'express';
import * as channelsService from './channels.service';
import { successResponse } from '../../utils/response';

export async function getChannels(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const channels = await channelsService.getChannels(propertyId);
    successResponse(res, channels);
  } catch (err) {
    next(err);
  }
}

export async function createMapping(req: Request, res: Response, next: NextFunction) {
  try {
    const mapping = await channelsService.createMapping(req.body);
    successResponse(res, mapping, 'Channel mapping created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateMapping(req: Request, res: Response, next: NextFunction) {
  try {
    const mapping = await channelsService.updateMapping(req.params.id, req.body);
    successResponse(res, mapping, 'Channel mapping updated');
  } catch (err) {
    next(err);
  }
}

export async function syncInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await channelsService.syncInventory(req.params.id);
    successResponse(res, result, 'Sync initiated');
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const stats = await channelsService.getStats(propertyId);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}
