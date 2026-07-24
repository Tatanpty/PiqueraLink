import { Router, Request, Response, NextFunction } from 'express';
import { lostItemsController } from './lost-items.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

// Reportar objeto perdido (pasajero o conductor)
router.post(
  '/',
  authorize('passenger', 'driver'),
  (req: Request, res: Response, next: NextFunction) =>
    lostItemsController.report(req, res, next)
);

// Mis reportes como conductor
router.get(
  '/me',
  authorize('driver'),
  (req: Request, res: Response, next: NextFunction) =>
    lostItemsController.getMyItems(req, res, next)
);

// Reportes de una piquera (admin/super_admin)
router.get(
  '/piquera/:piqueraId',
  authorize('admin', 'super_admin'),
  (req: Request, res: Response, next: NextFunction) =>
    lostItemsController.getByPiquera(req, res, next)
);

// Actualizar estado (admin/super_admin/conductor)
router.patch(
  '/:id/status',
  authorize('admin', 'super_admin', 'driver'),
  (req: Request, res: Response, next: NextFunction) =>
    lostItemsController.updateStatus(req, res, next)
);

export default router;
