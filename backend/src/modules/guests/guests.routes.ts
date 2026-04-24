import { Router } from 'express';
import * as guestsController from './guests.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', guestsController.getGuests);
router.post('/', guestsController.createGuest);
router.post('/merge', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), guestsController.mergeDuplicates);
router.get('/:id', guestsController.getGuestById);
router.put('/:id', guestsController.updateGuest);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), guestsController.deleteGuest);
router.post('/:id/blacklist', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), guestsController.blacklistGuest);
router.post('/:id/unblacklist', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), guestsController.unblacklistGuest);
router.get('/:id/history', guestsController.getGuestHistory);
router.get('/:id/loyalty', guestsController.getLoyaltyHistory);

export default router;
