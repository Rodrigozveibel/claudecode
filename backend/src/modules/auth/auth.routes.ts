import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
} from './auth.schema';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateBody(updateProfileSchema), authController.updateProfile);

export default router;
