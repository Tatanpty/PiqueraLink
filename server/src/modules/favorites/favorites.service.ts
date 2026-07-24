import prisma from '../../config/database';
import { CreateFavoriteInput, UpdateFavoriteInput } from './favorites.validators';

export class FavoritesService {
  /**
   * Obtener todos los favoritos de un usuario.
   */
  async getAll(userId: string) {
    return await prisma.favoriteLocation.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Crear un destino favorito.
   */
  async create(userId: string, data: CreateFavoriteInput) {
    return await prisma.favoriteLocation.create({
      data: {
        userId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        icon: data.icon || '📍',
      },
    });
  }

  /**
   * Actualizar un destino favorito.
   */
  async update(userId: string, favoriteId: string, data: UpdateFavoriteInput) {
    const favorite = await prisma.favoriteLocation.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite || favorite.userId !== userId) {
      throw Object.assign(new Error('Favorito no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    return await prisma.favoriteLocation.update({
      where: { id: favoriteId },
      data,
    });
  }

  /**
   * Eliminar un destino favorito.
   */
  async delete(userId: string, favoriteId: string) {
    const favorite = await prisma.favoriteLocation.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite || favorite.userId !== userId) {
      throw Object.assign(new Error('Favorito no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    await prisma.favoriteLocation.delete({ where: { id: favoriteId } });
    return { message: 'Favorito eliminado' };
  }
}

export const favoritesService = new FavoritesService();
