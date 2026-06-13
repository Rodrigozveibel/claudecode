import { Request, Response, NextFunction } from 'express';
import * as billingService from './billing.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { invoices, total } = await billingService.getInvoices(propertyId, {
      status: req.query.status as InvoiceStatus | undefined,
      page,
      limit,
    });
    paginatedResponse(res, invoices, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await billingService.getInvoice(req.params.id);
    successResponse(res, invoice);
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { reservationId } = req.body;
    const invoice = await billingService.createInvoice(reservationId);
    successResponse(res, invoice, 'Invoice created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await billingService.updateInvoice(req.params.id, req.body);
    successResponse(res, invoice, 'Invoice updated');
  } catch (err) {
    next(err);
  }
}

export async function issueInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await billingService.issueInvoice(req.params.id);
    successResponse(res, invoice, 'Invoice issued');
  } catch (err) {
    next(err);
  }
}

export async function recordPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, method, reference, notes } = req.body;
    const payment = await billingService.recordPayment(
      req.params.id,
      amount,
      method as PaymentMethod,
      reference,
      notes,
      req.user?.id
    );
    successResponse(res, payment, 'Payment recorded', 201);
  } catch (err) {
    next(err);
  }
}
