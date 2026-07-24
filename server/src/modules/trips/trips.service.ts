import prisma from '../../config/database';
import { TurnStatus, TripStatus } from '@prisma/client';
import { CreateTripInput } from './trips.validators';
import {
  emitTripAssigned,
  emitDriverInfo,
  emitTripStatusChanged,
} from './trips.events';
import { emitQueueStateChanged } from '../queue/queue.events';
import { walletService } from '../wallet/wallet.service';
import { fareCalculator } from '../payments/fare.calculator';
import { promosService } from '../promos/promos.service';

export class TripsService {
  /**
   * Pasajero solicita un viaje.
   * Asigna automáticamente al primer conductor en la cola FIFO de la piquera.
   */
  async requestTrip(passengerId: string, data: CreateTripInput) {
    return await prisma.$transaction(async (tx) => {
      // Verificar que la piquera existe y está activa
      const piquera = await tx.piquera.findUnique({
        where: { id: data.piqueraId },
      });

      if (!piquera) {
        throw Object.assign(new Error('Piquera no encontrada'), {
          statusCode: 404,
          isOperational: true,
        });
      }

      if (!piquera.isActive) {
        throw Object.assign(new Error('La piquera no está activa'), {
          statusCode: 400,
          isOperational: true,
        });
      }

      // Obtener primer conductor en la cola (posición más baja = primero)
      const firstTurn = await tx.turn.findFirst({
        where: {
          piqueraId: data.piqueraId,
          status: TurnStatus.active,
        },
        orderBy: { position: 'asc' },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              vehicle: {
                select: {
                  id: true,
                  plate: true,
                  model: true,
                  color: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!firstTurn) {
        throw Object.assign(
          new Error('No hay conductores disponibles en esta piquera'),
          { statusCode: 400, isOperational: true }
        );
      }

      // Calcular tarifa upfront
      const fareBreakdown = await fareCalculator.calculateUpfrontFare({
        originLat: data.originLat,
        originLng: data.originLng,
        destinationLat: data.destinationLat,
        destinationLng: data.destinationLng,
        piqueraId: data.piqueraId,
      });

      let finalFare = fareBreakdown.totalFare;

      // Aplicar código promo si existe
      let promoDiscount = 0;
      if (data.promoCode) {
        const promoResult = await promosService.applyPromoCode(
          data.promoCode,
          passengerId,
          finalFare
        );
        if (promoResult) {
          promoDiscount = promoResult.discount;
          finalFare = Math.round((finalFare - promoDiscount) * 100) / 100;
        }
      }

      // Crear solicitud de viaje con conductor asignado y tarifa
      const trip = await tx.tripRequest.create({
        data: {
          passengerId,
          driverId: firstTurn.driverId,
          piqueraId: data.piqueraId,
          originLat: data.originLat,
          originLng: data.originLng,
          destination: data.destination,
          fareAmount: finalFare,
          fareBreakdown: { ...fareBreakdown, promoDiscount },
          status: TripStatus.assigned,
          assignedAt: new Date(),
        },
      });

      // Cambiar estado del turno a in_service
      await tx.turn.update({
        where: { id: firstTurn.id },
        data: { status: TurnStatus.in_service },
      });

      // Recalcular posiciones en la cola
      const remainingTurns = await tx.turn.findMany({
        where: { piqueraId: data.piqueraId, status: TurnStatus.active },
        orderBy: { position: 'asc' },
      });

      for (let i = 0; i < remainingTurns.length; i++) {
        await tx.turn.update({
          where: { id: remainingTurns[i].id },
          data: { position: i + 1 },
        });
      }

      // Obtener datos del pasajero para el evento
      const passenger = await tx.user.findUnique({
        where: { id: passengerId },
        select: { name: true },
      });

      // Emitir eventos Socket.IO
      emitTripAssigned(firstTurn.driverId, {
        tripId: trip.id,
        passenger: {
          name: passenger?.name || 'Pasajero',
          destination: data.destination,
        },
        originLat: data.originLat,
        originLng: data.originLng,
      });

      emitDriverInfo(passengerId, {
        tripId: trip.id,
        driver: {
          id: firstTurn.driver.id,
          name: firstTurn.driver.name,
          role: 'driver',
        },
        vehicle: firstTurn.driver.vehicle || {
          id: '',
          plate: 'Sin vehículo',
          model: '',
          color: '',
          photoUrl: '',
        },
        estimatedMinutes: 5, // Estimación base
      });

      emitTripStatusChanged(trip.id, {
        tripId: trip.id,
        status: 'assigned',
        timestamp: new Date().toISOString(),
      });

      // Emitir actualización de cola
      const updatedQueue = await tx.turn.findMany({
        where: { piqueraId: data.piqueraId, status: TurnStatus.active },
        orderBy: { position: 'asc' },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              vehicle: {
                select: { id: true, plate: true, model: true, color: true, photoUrl: true },
              },
            },
          },
        },
      });

      emitQueueStateChanged({
        piqueraId: data.piqueraId,
        queue: updatedQueue.map((t: any) => ({
          driverId: t.driver.id,
          driverName: t.driver.name,
          vehicle: t.driver.vehicle || { id: '', plate: '', model: '', color: '', photoUrl: '' },
          position: t.position,
          joinedAt: t.joinedAt.toISOString(),
        })),
      });

      return {
        trip,
        driver: {
          id: firstTurn.driver.id,
          name: firstTurn.driver.name,
          vehicle: firstTurn.driver.vehicle,
        },
      };
    });
  }

  /**
   * Conductor acepta el viaje asignado.
   */
  async acceptTrip(driverId: string, tripId: string) {
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw Object.assign(new Error('Viaje no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    if (trip.driverId !== driverId) {
      throw Object.assign(new Error('Este viaje no te fue asignado'), {
        statusCode: 403,
        isOperational: true,
      });
    }

    if (trip.status !== TripStatus.assigned) {
      throw Object.assign(
        new Error(`No se puede aceptar un viaje en estado "${trip.status}"`),
        { statusCode: 400, isOperational: true }
      );
    }

    const updated = await prisma.tripRequest.update({
      where: { id: tripId },
      data: { status: TripStatus.accepted },
    });

    emitTripStatusChanged(tripId, {
      tripId,
      status: 'accepted',
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Conductor rechaza el viaje asignado.
   * El conductor es removido de la cola y el viaje queda cancelado.
   */
  async rejectTrip(driverId: string, tripId: string) {
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.tripRequest.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        throw Object.assign(new Error('Viaje no encontrado'), {
          statusCode: 404,
          isOperational: true,
        });
      }

      if (trip.driverId !== driverId) {
        throw Object.assign(new Error('Este viaje no te fue asignado'), {
          statusCode: 403,
          isOperational: true,
        });
      }

      if (trip.status !== TripStatus.assigned) {
        throw Object.assign(
          new Error(`No se puede rechazar un viaje en estado "${trip.status}"`),
          { statusCode: 400, isOperational: true }
        );
      }

      // Cancelar el viaje
      const updated = await tx.tripRequest.update({
        where: { id: tripId },
        data: { status: TripStatus.cancelled },
      });

      // Remover conductor del turno (penalización por rechazo)
      await tx.turn.updateMany({
        where: {
          driverId,
          piqueraId: trip.piqueraId,
          status: TurnStatus.in_service,
        },
        data: {
          status: TurnStatus.removed,
          removedAt: new Date(),
        },
      });

      emitTripStatusChanged(tripId, {
        tripId,
        status: 'cancelled',
        timestamp: new Date().toISOString(),
      });

      return updated;
    });
  }

  /**
   * Conductor marca viaje como completado.
   */
  async completeTrip(driverId: string, tripId: string) {
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.tripRequest.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        throw Object.assign(new Error('Viaje no encontrado'), {
          statusCode: 404,
          isOperational: true,
        });
      }

      if (trip.driverId !== driverId) {
        throw Object.assign(new Error('Este viaje no te fue asignado'), {
          statusCode: 403,
          isOperational: true,
        });
      }

      if (trip.status !== TripStatus.accepted && trip.status !== TripStatus.in_progress) {
        throw Object.assign(
          new Error(`No se puede completar un viaje en estado "${trip.status}"`),
          { statusCode: 400, isOperational: true }
        );
      }

      // Marcar como completado
      const updated = await tx.tripRequest.update({
        where: { id: tripId },
        data: {
          status: TripStatus.completed,
          completedAt: new Date(),
        },
      });

      // Remover el turno in_service (el conductor termina su servicio)
      await tx.turn.updateMany({
        where: {
          driverId,
          piqueraId: trip.piqueraId,
          status: TurnStatus.in_service,
        },
        data: {
          status: TurnStatus.removed,
          removedAt: new Date(),
        },
      });

      emitTripStatusChanged(tripId, {
        tripId,
        status: 'completed',
        timestamp: new Date().toISOString(),
      });

      // Acreditar ganancias al conductor automáticamente
      await walletService.creditTripEarning(driverId, tripId, trip.piqueraId);

      return updated;
    });
  }

  /**
   * Obtener estado actual de un viaje.
   */
  async getTripStatus(tripId: string, userId: string) {
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            vehicle: {
              select: { id: true, plate: true, model: true, color: true, photoUrl: true },
            },
          },
        },
        piquera: {
          select: { id: true, name: true },
        },
      },
    });

    if (!trip) {
      throw Object.assign(new Error('Viaje no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    // Solo el pasajero o conductor asignado pueden ver el viaje
    if (trip.passengerId !== userId && trip.driverId !== userId) {
      throw Object.assign(new Error('No tienes acceso a este viaje'), {
        statusCode: 403,
        isOperational: true,
      });
    }

    return {
      id: trip.id,
      status: trip.status,
      destination: trip.destination,
      originLat: trip.originLat,
      originLng: trip.originLng,
      piquera: trip.piquera,
      driver: trip.driver
        ? {
            id: trip.driver.id,
            name: trip.driver.name,
            vehicle: trip.driver.vehicle,
          }
        : null,
      createdAt: trip.createdAt,
      assignedAt: trip.assignedAt,
      completedAt: trip.completedAt,
    };
  }
}

export const tripsService = new TripsService();
