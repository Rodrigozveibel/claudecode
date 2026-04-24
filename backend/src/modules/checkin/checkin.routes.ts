import { Router } from 'express';
import * as checkinController from './checkin.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/current', checkinController.getCurrentGuests);
router.post('/checkin', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), checkinController.checkIn);
router.post('/checkout/:reservationId', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), checkinController.checkOut);

export default router;
