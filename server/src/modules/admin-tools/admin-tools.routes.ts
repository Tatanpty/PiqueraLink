import { Router, Request, Response, NextFunction } from 'express';
import { adminToolsController } from './admin-tools.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// Exportar reporte
router.get(
  '/reports/export',
  (req: Request, res: Response, next: NextFunction) =>
    adminToolsController.exportReport(req, res, next)
);

// Listar usuarios
router.get(
  '/users',
  (req: Request, res: Response, next: NextFunction) =>
    adminToolsController.listUsers(req, res, next)
);

// Actualizar estado de un usuario (bloquear/suspender/reactivar)
router.patch(
  '/users/:id/status',
  (req: Request, res: Response, next: NextFunction) =>
    adminToolsController.updateUserStatus(req, res, next)
);

export default router;
