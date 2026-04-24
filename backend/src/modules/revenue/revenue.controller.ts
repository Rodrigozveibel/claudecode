import { Response, NextFunction } from 'express';
import * as revenueService from './revenue.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

function getDateRange(req: AuthRequest) {
  const propertyId = req.query.propertyId as string || req.user?.propertyId!;
  const startDate = new Date(req.query.startDate as string || new Date().setDate(1));
  const endDate = new Date(req.query.endDate as string || new Date());
  return { propertyId, startDate, endDate };
}

export async function getOccupancyMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const metrics = await revenueService.getOccupancyMetrics(propertyId, startDate, endDate);
    successResponse(res, metrics);
  } catch (error) {
    next(error);
  }
}

export async function getRevenueMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const metrics = await revenueService.getRevenueMetrics(propertyId, startDate, endDate);
    successResponse(res, metrics);
  } catch (error) {
    next(error);
  }
}

export async function getADR(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const adr = await revenueService.getADR(propertyId, startDate, endDate);
    successResponse(res, adr);
  } catch (error) {
    next(error);
  }
}

export async function getRevPAR(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const revpar = await revenueService.getRevPAR(propertyId, startDate, endDate);
    successResponse(res, revpar);
  } catch (error) {
    next(error);
  }
}

export async function createRateRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const rule = await revenueService.createRateRule({ ...req.body, propertyId });
    successResponse(res, rule, 'Rate rule created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getRateRules(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const rules = await revenueService.getRateRules(propertyId);
    successResponse(res, rules);
  } catch (error) {
    next(error);
  }
}

export async function updateRateRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await revenueService.updateRateRule(req.params.id, req.body);
    successResponse(res, rule, 'Rate rule updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteRateRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await revenueService.deleteRateRule(req.params.id);
    successResponse(res, null, 'Rate rule deleted');
  } catch (error) {
    next(error);
  }
}

export async function getRatesForDateRange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, startDate, endDate } = getDateRange(req);
    const rates = await revenueService.getRatesForDateRange(propertyId, startDate, endDate);
    successResponse(res, rates);
  } catch (error) {
    next(error);
  }
}

export async function getYieldSuggestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const suggestions = await revenueService.getYieldSuggestions(propertyId);
    successResponse(res, suggestions);
  } catch (error) {
    next(error);
  }
}
