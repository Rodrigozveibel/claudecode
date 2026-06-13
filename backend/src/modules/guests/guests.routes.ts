import { Router } from 'express';
import * as guestsController from './guests.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/search', guestsController.search);
router.get('/', guestsController.getAll);
router.get('/:id/history', guestsController.getHistory);
router.get('/:id', guestsController.getById);
router.post('/', guestsController.create);
router.put('/:id', guestsController.update);

export default router;
