import { Router, Request, Response, NextFunction } from 'express';
import { locationService } from './location.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const piqueraIdSchema = z.object({
  piqueraId: z.string().uuid(),
});

/**
 * GET /api/locations/piquera/:piqueraId
 * Obtener ubicaciones de conductores activos de una piquera.
 * (admin o super_admin)
 */
router.get(
  '/piquera/:piqueraId',
  authorize('admin', 'super_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { piqueraId } = piqueraIdSchema.parse(req.params);
      const locations = await locationService.getActiveDriverLocations(piqueraId);
      res.status(200).json(locations);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/locations/me
 * Obtener mi propia ubicación almacenada (conductor).
 */
router.get(
  '/me',
  authorize('driver'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const location = await locationService.getDriverLocation(req.user!.userId);
      res.status(200).json(location);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
