import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { AuthService } from '../services/authService';
import { requireAuth } from '../middleware/authMiddleware';

export function bookingRoutes(controller: BookingController, authService: AuthService): Router {
  const router = Router();
  router.use(requireAuth(authService));

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.post('/:id/cancel', controller.cancel);
  router.delete('/:id', controller.delete);

  return router;
}
