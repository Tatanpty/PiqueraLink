import { Router, Request, Response, NextFunction } from 'express';
import { piquerasController } from './piqueras.controller';
import { metricsController } from '../metrics/metrics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Piquera más cercana (debe ir ANTES de las rutas con params)
router.get('/nearest', (req: Request, res: Response, next: NextFunction) => piquerasController.getNearest(req, res, next));

// Piqueras cercanas ordenadas por distancia
router.get('/nearby', (req: Request, res: Response, next: NextFunction) => piquerasController.getNearby(req, res, next));

// Todas las piqueras activas
router.get('/', (req: Request, res: Response, next: NextFunction) => piquerasController.getAll(req, res, next));

// Métricas locales de una piquera (admin o super_admin)
router.get(
  '/:piqueraId/metrics',
  authorize('admin', 'super_admin'),
  (req: Request, res: Response, next: NextFunction) => metricsController.getPiqueraMetrics(req, res, next)
);

export default router;
