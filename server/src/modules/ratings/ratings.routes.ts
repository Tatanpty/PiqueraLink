import { Router, Request, Response, NextFunction } from 'express';
import { ratingsController } from './ratings.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

// Emitir calificación (pasajero o conductor)
router.post(
  '/',
  authorize('passenger', 'driver'),
  (req: Request, res: Response, next: NextFunction) => ratingsController.createReview(req, res, next)
);

// Mis calificaciones
router.get(
  '/me',
  (req: Request, res: Response, next: NextFunction) => ratingsController.getMyReviews(req, res, next)
);

// Mi resumen de rating
router.get(
  '/me/summary',
  (req: Request, res: Response, next: NextFunction) => ratingsController.getMyRatingSummary(req, res, next)
);

// Calificaciones de un usuario específico (público para cualquier autenticado)
router.get(
  '/user/:userId',
  (req: Request, res: Response, next: NextFunction) => ratingsController.getUserReviews(req, res, next)
);

// Resumen de rating de un usuario específico
router.get(
  '/user/:userId/summary',
  (req: Request, res: Response, next: NextFunction) => ratingsController.getUserRatingSummary(req, res, next)
);

export default router;
