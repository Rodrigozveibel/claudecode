import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getStats, occupancyTrend, revenueByChannel } from './dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/occupancy-trend', occupancyTrend);
router.get('/revenue-by-channel', revenueByChannel);

export default router;
