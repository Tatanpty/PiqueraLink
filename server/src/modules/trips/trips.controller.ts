import { Request, Response, NextFunction } from 'express';
import { tripsService } from './trips.service';
import { createTripSchema, tripIdParamSchema } from './trips.validators';

export class TripsController {
  /**
   * POST /api/trips/request
   * Pasajero solicita un viaje desde una piquera.
   */
  async requestTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTripSchema.parse(req.body);
      const passengerId = req.user!.userId;

      const result = await tripsService.requestTrip(passengerId, data);

      res.status(201).json({
        message: 'Viaje solicitado, conductor asignado',
        trip: result.trip,
        driver: result.driver,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/trips/:tripId/accept
   * Conductor acepta el viaje asignado.
   */
  async acceptTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId } = tripIdParamSchema.parse(req.params);
      const driverId = req.user!.userId;

      const trip = await tripsService.acceptTrip(driverId, tripId);

      res.status(200).json({
        message: 'Viaje aceptado',
        trip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/trips/:tripId/reject
   * Conductor rechaza el viaje asignado.
   */
  async rejectTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId } = tripIdParamSchema.parse(req.params);
      const driverId = req.user!.userId;

      const trip = await tripsService.rejectTrip(driverId, tripId);

      res.status(200).json({
        message: 'Viaje rechazado',
        trip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/trips/:tripId/complete
   * Conductor marca viaje como completado.
   */
  async completeTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId } = tripIdParamSchema.parse(req.params);
      const driverId = req.user!.userId;

      const trip = await tripsService.completeTrip(driverId, tripId);

      res.status(200).json({
        message: 'Viaje completado exitosamente',
        trip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/trips/:tripId/status
   * Obtener estado actual del viaje (pasajero o conductor).
   */
  async getTripStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId } = tripIdParamSchema.parse(req.params);
      const userId = req.user!.userId;

      const result = await tripsService.getTripStatus(tripId, userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const tripsController = new TripsController();
