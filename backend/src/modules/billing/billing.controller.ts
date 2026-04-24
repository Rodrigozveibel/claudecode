import { Response, NextFunction } from 'express';
import * as billingService from './billing.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function createInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const invoice = await billingService.createInvoice({ ...req.body, propertyId });
    successResponse(res, invoice, 'Invoice created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string | undefined || req.user?.propertyId;
    const { items, total, page, limit } = await billingService.getInvoices(req, propertyId);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id);
    successResponse(res, invoice);
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await billingService.updateInvoice(req.params.id, req.body);
    successResponse(res, invoice, 'Invoice updated');
  } catch (error) {
    next(error);
  }
}

export async function issueInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await billingService.issueInvoice(req.params.id);
    successResponse(res, invoice, 'Invoice issued');
  } catch (error) {
    next(error);
  }
}

export async function applyDiscount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { discount, reason } = req.body;
    const invoice = await billingService.applyDiscount(req.params.id, discount, reason);
    successResponse(res, invoice, 'Discount applied');
  } catch (error) {
    next(error);
  }
}

export async function recordPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const payment = await billingService.recordPayment({ ...req.body, propertyId, processedBy: req.user!.id });
    successResponse(res, payment, 'Payment recorded', 201);
  } catch (error) {
    next(error);
  }
}

export async function refundPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await billingService.refundPayment(req.params.paymentId, req.body.reason);
    successResponse(res, payment, 'Payment refunded');
  } catch (error) {
    next(error);
  }
}

export async function getBillingReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const startDate = new Date(req.query.startDate as string || new Date().setDate(1));
    const endDate = new Date(req.query.endDate as string || new Date());
    const report = await billingService.getBillingReport(propertyId, startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}
