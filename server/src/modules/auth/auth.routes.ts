import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Rutas públicas
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Rutas protegidas
router.post('/refresh', authenticate, (req, res, next) => authController.refresh(req, res, next));

export default router;
