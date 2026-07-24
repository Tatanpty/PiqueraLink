import { Router, Request, Response, NextFunction } from 'express';
import { sosController } from './sos.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

// Disparar alerta SOS (pasajero o conductor)
router.post(
  '/trigger',
  authorize('passenger', 'driver'),
  (req: Request, res: Response, next: NextFunction) => sosController.trigger(req, res, next)
);

// Alertas activas (admin / super_admin)
router.get(
  '/active',
  authorize('admin', 'super_admin'),
  (req: Request, res: Response, next: NextFunction) => sosController.getActive(req, res, next)
);

// Acusar recibo (admin / super_admin)
router.patch(
  '/:alertId/acknowledge',
  authorize('admin', 'super_admin'),
  (req: Request, res: Response, next: NextFunction) => sosController.acknowledge(req, res, next)
);

// Resolver alerta (admin / super_admin)
router.patch(
  '/:alertId/resolve',
  authorize('admin', 'super_admin'),
  (req: Request, res: Response, next: NextFunction) => sosController.resolve(req, res, next)
);

// Historial (admin / super_admin)
router.get(
  '/history',
  authorize('admin', 'super_admin'),
  (req: Request, res: Response, next: NextFunction) => sosController.getHistory(req, res, next)
);

export default router;
