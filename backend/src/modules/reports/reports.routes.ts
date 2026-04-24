import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'));

router.get('/occupancy', reportsController.getOccupancyReport);
router.get('/revenue', reportsController.getRevenueReport);
router.get('/guests', reportsController.getGuestReport);
router.get('/sources', reportsController.getSourceReport);
router.get('/housekeeping', reportsController.getHousekeepingReport);
router.get('/maintenance', reportsController.getMaintenanceReport);
router.get('/financial-summary', reportsController.getFinancialSummary);
router.get('/export/:type', reportsController.exportReport);

export default router;
