import { Router } from 'express';
import * as revenueController from './revenue.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/metrics', revenueController.getMetrics);
router.get('/rate-rules', revenueController.getRateRules);
router.post(
  '/rate-rules',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  revenueController.createRateRule
);
router.put(
  '/rate-rules/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  revenueController.updateRateRule
);
router.delete(
  '/rate-rules/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  revenueController.deleteRateRule
);

export default router;
