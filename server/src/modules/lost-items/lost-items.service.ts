import prisma from '../../config/database';
import { LostItemStatus } from '@prisma/client';
import { CreateLostItemInput } from './lost-items.validators';
import { emitLostItemReported } from './lost-items.events';

export class LostItemsService {
  /**
   * Reportar un objeto perdido en un viaje completado.
   */
  async reportLostItem(userId: string, data: CreateLostItemInput) {
    // Verificar que el viaje existe y el usuario participó
    const trip = await prisma.tripRequest.findUnique({
      where: { id: data.tripId },
      include: {
        driver: { select: { id: true, name: true } },
        passenger: { select: { id: true, name: true } },
      },
    });

    if (!trip) {
      throw Object.assign(new Error('Viaje no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    if (trip.passengerId !== userId && trip.driverId !== userId) {
      throw Object.assign(new Error('No participaste en este viaje'), {
        statusCode: 403,
        isOperational: true,
      });
    }

    if (trip.status !== 'completed') {
      throw Object.assign(new Error('Solo puedes reportar objetos de viajes completados'), {
        statusCode: 400,
        isOperational: true,
      });
    }

    const lostItem = await prisma.lostItem.create({
      data: {
        tripId: data.tripId,
        userId,
        description: data.description,
        status: LostItemStatus.pending,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Notificar al conductor si el reporte lo hizo el pasajero
    if (trip.driverId && userId === trip.passengerId) {
      emitLostItemReported(trip.driverId, {
        lostItemId: lostItem.id,
        tripId: trip.id,
        description: data.description,
        passengerName: trip.passenger.name,
        createdAt: lostItem.createdAt.toISOString(),
      });
    }

    return lostItem;
  }

  /**
   * Obtener objetos perdidos de una piquera (admin).
   */
  async getByPiquera(piqueraId: string) {
    return await prisma.lostItem.findMany({
      where: {
        trip: { piqueraId },
        status: { not: LostItemStatus.closed },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        trip: {
          select: {
            id: true,
            destination: true,
            driverId: true,
            driver: { select: { name: true, vehicle: { select: { plate: true } } } },
            completedAt: true,
          },
        },
      },
    });
  }

  /**
   * Obtener objetos perdidos asociados a un conductor.
   */
  async getByDriver(driverId: string) {
    return await prisma.lostItem.findMany({
      where: {
        trip: { driverId },
        status: { not: LostItemStatus.closed },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        trip: { select: { id: true, destination: true, completedAt: true } },
      },
    });
  }

  /**
   * Actualizar estado de un objeto perdido.
   */
  async updateStatus(lostItemId: string, status: LostItemStatus) {
    const item = await prisma.lostItem.findUnique({ where: { id: lostItemId } });

    if (!item) {
      throw Object.assign(new Error('Reporte no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    return await prisma.lostItem.update({
      where: { id: lostItemId },
      data: { status },
    });
  }
}

export const lostItemsService = new LostItemsService();
