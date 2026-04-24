import { Router } from 'express';
import * as crmController from './crm.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/messages', crmController.sendMessage);
router.post('/messages/inbound', crmController.recordInboundMessage);
router.get('/messages/guest/:guestId', crmController.getConversationHistory);
router.get('/feedback', crmController.getGuestFeedback);
router.get('/templates', crmController.getEmailTemplates);
router.post('/messages/pre-arrival/:reservationId', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), crmController.sendPreArrivalMessage);
router.post('/messages/post-stay/:reservationId', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), crmController.sendPostStayMessage);

export default router;
