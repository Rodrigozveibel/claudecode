import { Response, NextFunction } from 'express';
import * as crmService from './crm.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const message = await crmService.sendMessage({ ...req.body, propertyId });
    successResponse(res, message, 'Message sent', 201);
  } catch (error) {
    next(error);
  }
}

export async function getConversationHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit } = await crmService.getConversationHistory(req.params.guestId, req);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function sendPreArrivalMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await crmService.sendPreArrivalMessage(req.params.reservationId);
    successResponse(res, message, 'Pre-arrival message sent');
  } catch (error) {
    next(error);
  }
}

export async function sendPostStayMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await crmService.sendPostStayMessage(req.params.reservationId);
    successResponse(res, message, 'Post-stay message sent');
  } catch (error) {
    next(error);
  }
}

export async function getEmailTemplates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const templates = await crmService.getEmailTemplates();
    successResponse(res, templates);
  } catch (error) {
    next(error);
  }
}

export async function recordInboundMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const message = await crmService.recordInboundMessage({ ...req.body, propertyId });
    successResponse(res, message, 'Message recorded', 201);
  } catch (error) {
    next(error);
  }
}

export async function getGuestFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.query.propertyId as string || req.user?.propertyId!;
    const feedback = await crmService.getGuestFeedback(propertyId);
    successResponse(res, feedback);
  } catch (error) {
    next(error);
  }
}
