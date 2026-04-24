import { Router } from 'express';
import * as notificationsController from './notifications.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.getNotifications);
router.get('/stats', notificationsController.getNotificationStats);
router.post('/mark-all-read', notificationsController.markAllAsRead);
router.post('/send', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), notificationsController.sendNotification);
router.post('/bulk', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), notificationsController.sendBulkNotifications);
router.patch('/:id/read', notificationsController.markAsRead);
router.delete('/:id', notificationsController.deleteNotification);

export default router;
