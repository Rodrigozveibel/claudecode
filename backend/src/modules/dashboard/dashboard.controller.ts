import { Request, Response } from 'express';
import { getDashboardStats, getOccupancyTrend, getRevenueByChannel } from './dashboard.service';
import { successResponse } from '../../utils/response';

export async function getStats(req: Request, res: Response) {
  const propertyId = req.headers['x-property-id'] as string;
  const data = await getDashboardStats(propertyId);
  successResponse(res, data);
}

export async function occupancyTrend(req: Request, res: Response) {
  const propertyId = req.headers['x-property-id'] as string;
  const days = parseInt(req.query.days as string) || 30;
  const data = await getOccupancyTrend(propertyId, days);
  successResponse(res, data);
}

export async function revenueByChannel(req: Request, res: Response) {
  const propertyId = req.headers['x-property-id'] as string;
  const days = parseInt(req.query.days as string) || 7;
  const data = await getRevenueByChannel(propertyId, days);
  successResponse(res, data);
}
