import { Router } from 'express';
import { RoomController } from '../controllers/roomController';
import { AuthService } from '../services/authService';
import { requireAuth } from '../middleware/authMiddleware';

export function roomRoutes(controller: RoomController, authService: AuthService): Router {
  const router = Router();
  router.use(requireAuth(authService));

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
