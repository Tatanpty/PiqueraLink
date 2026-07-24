import { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service';
import { withdrawSchema, paginationSchema } from './wallet.validators';

export class WalletController {
  /**
   * GET /api/wallet/summary
   * Balance y ganancias del conductor.
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const summary = await walletService.getSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/wallet/transactions
   * Historial de transacciones.
   */
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { limit, offset } = paginationSchema.parse(req.query);
      const result = await walletService.getTransactions(userId, limit, offset);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wallet/withdraw
   * Solicitar retiro de fondos.
   */
  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { amount } = withdrawSchema.parse(req.body);
      const result = await walletService.requestWithdrawal(userId, amount);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const walletController = new WalletController();
