import { Request, Response, NextFunction } from 'express';
import { piquerasService } from './piqueras.service';
import { nearbyQuerySchema } from './piqueras.validators';

export class PiquerasController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const piqueras = await piquerasService.getAll();
      res.status(200).json(piqueras);
    } catch (error) {
      next(error);
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = nearbyQuerySchema.parse(req.query);
      const piqueras = await piquerasService.getNearby(lat, lng);
      res.status(200).json(piqueras);
    } catch (error) {
      next(error);
    }
  }

  async getNearest(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = nearbyQuerySchema.parse(req.query);
      const piquera = await piquerasService.getNearest(lat, lng);
      res.status(200).json(piquera);
    } catch (error) {
      next(error);
    }
  }
}

export const piquerasController = new PiquerasController();
