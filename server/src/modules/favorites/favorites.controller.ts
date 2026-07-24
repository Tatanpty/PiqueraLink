import { Request, Response, NextFunction } from 'express';
import { favoritesService } from './favorites.service';
import { createFavoriteSchema, updateFavoriteSchema, favoriteIdSchema } from './favorites.validators';

export class FavoritesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const favorites = await favoritesService.getAll(req.user!.userId);
      res.status(200).json(favorites);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFavoriteSchema.parse(req.body);
      const favorite = await favoritesService.create(req.user!.userId, data);
      res.status(201).json({ message: 'Favorito guardado', favorite });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { favoriteId } = favoriteIdSchema.parse(req.params);
      const data = updateFavoriteSchema.parse(req.body);
      const favorite = await favoritesService.update(req.user!.userId, favoriteId, data);
      res.status(200).json({ message: 'Favorito actualizado', favorite });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { favoriteId } = favoriteIdSchema.parse(req.params);
      const result = await favoritesService.delete(req.user!.userId, favoriteId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const favoritesController = new FavoritesController();
