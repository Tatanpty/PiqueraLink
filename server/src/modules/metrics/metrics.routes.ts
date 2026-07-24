import { Router } from 'express';
import { metricsController } from './metrics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Métricas globales — exclusivo super_admin
router.get(
  '/global',
  authorize('super_admin'),
  (req, res, next) => metricsController.getGlobalMetrics(req, res, next)
);

export default router;
