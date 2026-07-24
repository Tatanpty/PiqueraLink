import { Request, Response, NextFunction } from 'express';
import { tripShareService } from './trip-share.service';
import { z } from 'zod';

const tripIdSchema = z.object({
  tripId: z.string().uuid(),
});

const tokenSchema = z.object({
  token: z.string().min(1),
});

export class TripShareController {
  /**
   * POST /api/trips/:tripId/share
   * Generar un enlace para compartir el viaje (autenticado, pasajero).
   */
  async generateShareLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId } = tripIdSchema.parse(req.params);
      const passengerId = req.user!.userId;

      const result = await tripShareService.generateShareToken(tripId, passengerId);

      res.status(201).json({
        message: 'Enlace de seguimiento generado',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/trips/share/:token
   * Vista pública del viaje en tiempo real (sin auth).
   */
  async getSharedTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = tokenSchema.parse(req.params);
      const tripData = await tripShareService.getTripByShareToken(token);

      res.status(200).json(tripData);
    } catch (error) {
      next(error);
    }
  }
}

export const tripShareController = new TripShareController();
