import { Router } from 'express';
import { queueController } from './queue.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Todas las rutas de cola requieren autenticación
router.use(authenticate);

// Rutas exclusivas para conductores
router.post(
  '/join/:piqueraId',
  authorize('driver'),
  (req, res, next) => queueController.join(req, res, next)
);

router.delete(
  '/leave/:piqueraId',
  authorize('driver'),
  (req, res, next) => queueController.leave(req, res, next)
);

router.get(
  '/position/:piqueraId',
  authorize('driver'),
  (req, res, next) => queueController.getPosition(req, res, next)
);

// Ruta accesible para cualquier usuario autenticado
router.get(
  '/status/:piqueraId',
  (req, res, next) => queueController.getStatus(req, res, next)
);

export default router;
