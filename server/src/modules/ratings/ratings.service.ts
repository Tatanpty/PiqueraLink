import prisma from '../../config/database';
import { TripStatus } from '@prisma/client';
import { CreateReviewInput } from './ratings.validators';

export class RatingsService {
  /**
   * Crear una calificación para un viaje completado.
   * El autor califica a la contraparte (pasajero→conductor o conductor→pasajero).
   */
  async createReview(authorId: string, data: CreateReviewInput) {
    // Verificar que el viaje existe y está completado
    const trip = await prisma.tripRequest.findUnique({
      where: { id: data.tripId },
    });

    if (!trip) {
      throw Object.assign(new Error('Viaje no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    if (trip.status !== TripStatus.completed) {
      throw Object.assign(new Error('Solo puedes calificar viajes completados'), {
        statusCode: 400,
        isOperational: true,
      });
    }

    // Determinar el targetId (la contraparte)
    let targetId: string;

    if (authorId === trip.passengerId) {
      // Pasajero califica al conductor
      if (!trip.driverId) {
        throw Object.assign(new Error('El viaje no tiene conductor asignado'), {
          statusCode: 400,
          isOperational: true,
        });
      }
      targetId = trip.driverId;
    } else if (authorId === trip.driverId) {
      // Conductor califica al pasajero
      targetId = trip.passengerId;
    } else {
      throw Object.assign(new Error('No participaste en este viaje'), {
        statusCode: 403,
        isOperational: true,
      });
    }

    // Verificar que no haya calificado ya este viaje
    const existing = await prisma.review.findUnique({
      where: { tripId_authorId: { tripId: data.tripId, authorId } },
    });

    if (existing) {
      throw Object.assign(new Error('Ya calificaste este viaje'), {
        statusCode: 409,
        isOperational: true,
      });
    }

    // Crear la review
    const review = await prisma.review.create({
      data: {
        tripId: data.tripId,
        authorId,
        targetId,
        rating: data.rating,
        comment: data.comment || null,
      },
      include: {
        author: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      },
    });

    // Actualizar promedio de rating del target
    await this.recalculateRating(targetId);

    return review;
  }

  /**
   * Obtener calificaciones recibidas por un usuario.
   */
  async getUserReviews(userId: string, limit: number = 20) {
    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, name: true } },
        trip: { select: { id: true, destination: true, createdAt: true } },
      },
    });

    return reviews;
  }

  /**
   * Obtener el resumen de rating de un usuario.
   */
  async getUserRatingSummary(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ratingAverage: true, ratingCount: true },
    });

    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    // Distribución por estrellas
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { targetId: userId },
      _count: { id: true },
    });

    const stars: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const group of distribution) {
      stars[group.rating] = group._count.id;
    }

    return {
      average: user.ratingAverage,
      totalReviews: user.ratingCount,
      distribution: stars,
    };
  }

  /**
   * Recalcular y actualizar el promedio de calificación de un usuario.
   */
  private async recalculateRating(userId: string) {
    const aggregate = await prisma.review.aggregate({
      where: { targetId: userId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        ratingAverage: aggregate._avg.rating || 0,
        ratingCount: aggregate._count.id,
      },
    });
  }
}

export const ratingsService = new RatingsService();
