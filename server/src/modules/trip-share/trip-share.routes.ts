import { Router, Request, Response, NextFunction } from 'express';
import { tripShareController } from './trip-share.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Ruta PÚBLICA: ver viaje compartido (sin autenticación)
router.get(
  '/share/:token',
  (req: Request, res: Response, next: NextFunction) =>
    tripShareController.getSharedTrip(req, res, next)
);

// Ruta PROTEGIDA: generar enlace de compartir
router.post(
  '/:tripId/share',
  authenticate,
  authorize('passenger'),
  (req: Request, res: Response, next: NextFunction) =>
    tripShareController.generateShareLink(req, res, next)
);

export default router;
