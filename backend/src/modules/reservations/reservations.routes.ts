import { Router } from 'express';
import * as reservationsController from './reservations.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/availability', reservationsController.checkAvailability);
router.post('/calculate-price', reservationsController.calculatePrice);
router.get('/', reservationsController.getReservations);
router.post('/', reservationsController.createReservation);
router.get('/confirmation/:confirmationNumber', reservationsController.getReservationByConfirmation);
router.get('/:id', reservationsController.getReservationById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), reservationsController.updateReservation);
router.post('/:id/cancel', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), reservationsController.cancelReservation);

export default router;
