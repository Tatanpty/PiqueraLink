import { Router, Request, Response, NextFunction } from 'express';
import { fareCalculator } from './fare.calculator';
import { authenticate } from '../../middleware/authenticate';
import { z } from 'zod';

const router = Router();

const fareEstimateSchema = z.object({
  originLat: z.coerce.number().min(-90).max(90),
  originLng: z.coerce.number().min(-180).max(180),
  destinationLat: z.coerce.number().min(-90).max(90).optional(),
  destinationLng: z.coerce.number().min(-180).max(180).optional(),
  piqueraId: z.string().uuid().optional(),
});

router.use(authenticate);

/**
 * POST /api/fare/estimate
 * Obtener estimación de tarifa antes de confirmar el viaje.
 */
router.post(
  '/estimate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = fareEstimateSchema.parse(req.body);
      const breakdown = await fareCalculator.calculateUpfrontFare(input);

      res.status(200).json({
        message: 'Tarifa estimada calculada',
        fare: breakdown,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
