import { Router } from 'express';
import { GuestController } from '../controllers/guestController';
import { AuthService } from '../services/authService';
import { requireAuth } from '../middleware/authMiddleware';

export function guestRoutes(controller: GuestController, authService: AuthService): Router {
  const router = Router();
  router.use(requireAuth(authService));

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
