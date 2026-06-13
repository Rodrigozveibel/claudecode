import { Router } from 'express';
import * as checkinController from './checkin.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/check-in', checkinController.checkIn);
router.post('/check-out', checkinController.checkOut);
router.get('/current-guests', checkinController.getCurrentGuests);

export default router;
