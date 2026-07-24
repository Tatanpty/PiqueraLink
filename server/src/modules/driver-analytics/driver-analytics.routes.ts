import { Router, Request, Response, NextFunction } from 'express';
import { driverAnalyticsService } from './driver-analytics.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('driver'));

/**
 * GET /api/drivers/analytics
 * Métricas y estadísticas del conductor autenticado.
 */
router.get(
  '/analytics',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.user!.userId;
      const analytics = await driverAnalyticsService.getDriverAnalytics(driverId);
      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
