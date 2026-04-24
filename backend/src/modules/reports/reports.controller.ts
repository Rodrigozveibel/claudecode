import { Response, NextFunction } from 'express';
import * as reportsService from './reports.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

function getParams(req: AuthRequest) {
  const propertyId = req.query.propertyId as string || req.user?.propertyId!;
  const startDate = new Date(req.query.startDate as string || new Date().setDate(1));
  const endDate = new Date(req.query.endDate as string || new Date());
  return { propertyId, startDate, endDate };
}

export async function getOccupancyReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const groupBy = req.query.groupBy as 'daily' | 'weekly' | 'monthly' || 'daily';
    const report = await reportsService.getOccupancyReport(propertyId, startDate, endDate, groupBy);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getRevenueReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const report = await reportsService.getRevenueReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getGuestReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const report = await reportsService.getGuestReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getSourceReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const report = await reportsService.getSourceReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getHousekeepingReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const report = await reportsService.getHousekeepingReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const report = await reportsService.getMaintenanceReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getFinancialSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const report = await reportsService.getFinancialSummary(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function exportReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getParams(req);
    const reportType = req.params.type;
    const csv = await reportsService.exportReport(propertyId, reportType, startDate, endDate);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
