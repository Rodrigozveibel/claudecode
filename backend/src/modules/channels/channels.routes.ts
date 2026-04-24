import { Router } from 'express';
import * as channelsController from './channels.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/webhook/:channelName', channelsController.handleWebhook);

router.use(authenticate);

router.get('/', channelsController.getChannelMappings);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), channelsController.createChannelMapping);
router.get('/statistics', channelsController.getChannelStatistics);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), channelsController.updateChannelMapping);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), channelsController.deleteChannelMapping);
router.post('/sync/inventory', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), channelsController.syncInventory);
router.post('/sync/rates', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), channelsController.syncRates);

export default router;
