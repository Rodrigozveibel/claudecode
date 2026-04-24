import { Router } from 'express';
import * as housekeepingController from './housekeeping.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', housekeepingController.getTasks);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), housekeepingController.createTask);
router.get('/report', housekeepingController.getHousekeepingReport);
router.post('/bulk-assign', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), housekeepingController.bulkAssignTasks);
router.patch('/:id/status', housekeepingController.updateTaskStatus);
router.patch('/:id/assign', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), housekeepingController.assignTask);
router.post('/:id/inspect', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), housekeepingController.inspectRoom);

export default router;
