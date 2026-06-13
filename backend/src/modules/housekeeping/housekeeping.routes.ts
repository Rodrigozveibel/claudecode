import { Router } from 'express';
import * as housekeepingController from './housekeeping.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/report', housekeepingController.getDailyReport);
router.get('/', housekeepingController.getTasks);
router.get('/:id', housekeepingController.getTask);
router.post('/', housekeepingController.createTask);
router.put('/:id/status', housekeepingController.updateTaskStatus);
router.put('/:id/assign', housekeepingController.assignTask);

export default router;
