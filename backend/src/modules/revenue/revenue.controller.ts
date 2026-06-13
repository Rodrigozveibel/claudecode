import { Request, Response, NextFunction } from 'express';
import * as revenueService from './revenue.service';
import { successResponse } from '../../utils/response';

export async function getMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const metrics = await revenueService.getMetrics(propertyId, startDate, endDate);
    successResponse(res, metrics);
  } catch (err) {
    next(err);
  }
}

export async function getRateRules(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const rules = await revenueService.getRateRules(propertyId);
    successResponse(res, rules);
  } catch (err) {
    next(err);
  }
}

export async function createRateRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await revenueService.createRateRule(req.body);
    successResponse(res, rule, 'Rate rule created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateRateRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await revenueService.updateRateRule(req.params.id, req.body);
    successResponse(res, rule, 'Rate rule updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteRateRule(req: Request, res: Response, next: NextFunction) {
  try {
    await revenueService.deleteRateRule(req.params.id);
    successResponse(res, null, 'Rate rule deleted');
  } catch (err) {
    next(err);
  }
}
