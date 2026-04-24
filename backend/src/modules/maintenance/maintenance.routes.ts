import { Router } from 'express';
import * as maintenanceController from './maintenance.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', maintenanceController.getMaintenanceRequests);
router.post('/', maintenanceController.createMaintenanceRequest);
router.get('/report', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), maintenanceController.getMaintenanceReport);
router.get('/room/:roomId', maintenanceController.getMaintenanceHistoryByRoom);
router.get('/:id', maintenanceController.getMaintenanceRequestById);
router.put('/:id', maintenanceController.updateMaintenanceRequest);
router.patch('/:id/assign', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), maintenanceController.assignMaintenanceRequest);

export default router;
