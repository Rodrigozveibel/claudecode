import { Router } from 'express';
import * as propertiesController from './properties.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', propertiesController.getProperties);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), propertiesController.createProperty);
router.get('/:id', propertiesController.getPropertyById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), propertiesController.updateProperty);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), propertiesController.deleteProperty);
router.get('/:id/settings', propertiesController.getPropertySettings);
router.put('/:id/settings', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), propertiesController.updatePropertySettings);

export default router;
