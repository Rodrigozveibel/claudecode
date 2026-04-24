import { Router } from 'express';
import * as roomsController from './rooms.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', roomsController.getRooms);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), roomsController.createRoom);
router.get('/availability', roomsController.getRoomAvailability);
router.post('/bulk-status', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK'), roomsController.bulkUpdateStatus);
router.get('/:id', roomsController.getRoomById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), roomsController.updateRoom);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING'), roomsController.updateRoomStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), roomsController.deleteRoom);

export default router;
