import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service';
import { successResponse } from '../../utils/response';

function getDateRange(req: Request) {
  const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
  return { propertyId, startDate, endDate };
}

export async function getOccupancyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const report = await reportsService.getOccupancyReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (err) {
    next(err);
  }
}

export async function getRevenueReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const report = await reportsService.getRevenueReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (err) {
    next(err);
  }
}

export async function getGuestReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const report = await reportsService.getGuestReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (err) {
    next(err);
  }
}

export async function getSourceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const report = await reportsService.getSourceReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (err) {
    next(err);
  }
}
