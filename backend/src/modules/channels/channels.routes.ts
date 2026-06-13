import { Router } from 'express';
import * as channelsController from './channels.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', channelsController.getStats);
router.get('/', channelsController.getChannels);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), channelsController.createMapping);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), channelsController.updateMapping);
router.post('/:id/sync', channelsController.syncInventory);

export default router;
