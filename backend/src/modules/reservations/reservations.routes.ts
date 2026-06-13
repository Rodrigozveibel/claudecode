import { Router } from 'express';
import * as reservationsController from './reservations.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/availability', reservationsController.checkAvailability);
router.get('/calculate-price', reservationsController.calculatePrice);
router.get('/today/arrivals', reservationsController.getTodayArrivals);
router.get('/today/departures', reservationsController.getTodayDepartures);
router.get('/', reservationsController.getAll);
router.get('/:id', reservationsController.getById);
router.post('/', reservationsController.create);
router.put('/:id', reservationsController.update);
router.post('/:id/cancel', reservationsController.cancel);

export default router;
