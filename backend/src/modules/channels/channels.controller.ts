import { Response, NextFunction } from 'express';
import * as channelsService from './channels.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { ChannelName } from '@prisma/client';

export async function getChannelMappings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const mappings = await channelsService.getChannelMappings(propertyId);
    successResponse(res, mappings);
  } catch (error) {
    next(error);
  }
}

export async function createChannelMapping(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const mapping = await channelsService.createChannelMapping({ ...req.body, propertyId });
    successResponse(res, mapping, 'Channel mapping created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateChannelMapping(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mapping = await channelsService.updateChannelMapping(req.params.id, req.body);
    successResponse(res, mapping, 'Channel mapping updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteChannelMapping(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await channelsService.deleteChannelMapping(req.params.id);
    successResponse(res, null, 'Channel mapping deleted');
  } catch (error) {
    next(error);
  }
}

export async function syncInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId!;
    const result = await channelsService.syncInventoryToChannel(propertyId, req.body.channelName as ChannelName);
    successResponse(res, result, 'Inventory synced');
  } catch (error) {
    next(error);
  }
}

export async function syncRates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId!;
    const result = await channelsService.syncRatesToChannel(propertyId, req.body.channelName as ChannelName);
    successResponse(res, result, 'Rates synced');
  } catch (error) {
    next(error);
  }
}

export async function handleWebhook(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const channelName = req.params.channelName as ChannelName;
    const reservation = await channelsService.handleChannelBookingWebhook(channelName, req.body);
    successResponse(res, reservation, 'Booking received', 201);
  } catch (error) {
    next(error);
  }
}

export async function getChannelStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const stats = await channelsService.getChannelStatistics(propertyId);
    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
}
