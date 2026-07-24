import { Request, Response, NextFunction } from 'express';
import { ratingsService } from './ratings.service';
import { createReviewSchema, userIdParamSchema } from './ratings.validators';

export class RatingsController {
  /**
   * POST /api/ratings
   * Emitir una calificación al finalizar un viaje.
   */
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createReviewSchema.parse(req.body);
      const authorId = req.user!.userId;

      const review = await ratingsService.createReview(authorId, data);

      res.status(201).json({
        message: 'Calificación registrada',
        review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ratings/user/:userId
   * Obtener calificaciones recibidas por un usuario.
   */
  async getUserReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = userIdParamSchema.parse(req.params);
      const reviews = await ratingsService.getUserReviews(userId);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ratings/user/:userId/summary
   * Resumen de rating (promedio + distribución).
   */
  async getUserRatingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = userIdParamSchema.parse(req.params);
      const summary = await ratingsService.getUserRatingSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ratings/me
   * Mis propias calificaciones recibidas.
   */
  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const reviews = await ratingsService.getUserReviews(userId);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ratings/me/summary
   * Mi resumen de rating.
   */
  async getMyRatingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const summary = await ratingsService.getUserRatingSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }
}

export const ratingsController = new RatingsController();
