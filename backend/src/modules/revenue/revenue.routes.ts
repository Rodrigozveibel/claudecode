import { Router } from 'express';
import * as revenueController from './revenue.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'));

router.get('/occupancy', revenueController.getOccupancyMetrics);
router.get('/metrics', revenueController.getRevenueMetrics);
router.get('/adr', revenueController.getADR);
router.get('/revpar', revenueController.getRevPAR);
router.get('/rates', revenueController.getRatesForDateRange);
router.get('/yield-suggestions', revenueController.getYieldSuggestions);
router.get('/rate-rules', revenueController.getRateRules);
router.post('/rate-rules', revenueController.createRateRule);
router.put('/rate-rules/:id', revenueController.updateRateRule);
router.delete('/rate-rules/:id', revenueController.deleteRateRule);

export default router;
