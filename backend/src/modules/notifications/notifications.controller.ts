import { Response, NextFunction } from 'express';
import * as notificationsService from './notifications.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit, unreadCount } = await notificationsService.getNotifications(req.user!.id, req);
    const response = { items, unreadCount };
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await notificationsService.markAsRead(req.params.id, req.user!.id);
    successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationsService.markAllAsRead(req.user!.id);
    successResponse(res, result, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
}

export async function sendNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const notification = await notificationsService.sendNotification({ ...req.body, propertyId });
    successResponse(res, notification, 'Notification sent', 201);
  } catch (error) {
    next(error);
  }
}

export async function sendBulkNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.body.propertyId || req.user?.propertyId;
    const result = await notificationsService.sendBulkNotifications({ ...req.body, propertyId });
    successResponse(res, result, `Sent ${result.count} notifications`);
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationsService.deleteNotification(req.params.id, req.user!.id);
    successResponse(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
}

export async function getNotificationStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await notificationsService.getNotificationStats(req.user!.id);
    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
}
