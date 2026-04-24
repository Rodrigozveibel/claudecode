import { Router } from 'express';
import * as roomTypesController from './room-types.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', roomTypesController.getRoomTypes);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), roomTypesController.createRoomType);
router.get('/:id', roomTypesController.getRoomTypeById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), roomTypesController.updateRoomType);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), roomTypesController.deleteRoomType);
router.get('/:id/pricing-calendar', roomTypesController.getPricingCalendar);

export default router;
