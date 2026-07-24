import { Router, Request, Response, NextFunction } from 'express';
import { walletController } from './wallet.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('driver'));

// Resumen financiero
router.get(
  '/summary',
  (req: Request, res: Response, next: NextFunction) =>
    walletController.getSummary(req, res, next)
);

// Historial de transacciones
router.get(
  '/transactions',
  (req: Request, res: Response, next: NextFunction) =>
    walletController.getTransactions(req, res, next)
);

// Solicitar retiro
router.post(
  '/withdraw',
  (req: Request, res: Response, next: NextFunction) =>
    walletController.withdraw(req, res, next)
);

export default router;
