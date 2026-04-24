import { Router } from 'express';
import * as staffController from './staff.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), staffController.getStaff);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), staffController.createStaff);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), staffController.getStaffMember);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), staffController.updateStaff);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), staffController.deactivateStaff);
router.patch('/:id/role', authorize('SUPER_ADMIN', 'ADMIN'), staffController.assignRole);
router.get('/:id/tasks', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), staffController.getStaffTasks);

export default router;
