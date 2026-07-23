import prisma from '../../config/database';
import { TurnStatus } from '@prisma/client';
import { emitQueueStateChanged, emitPositionUpdate } from './queue.events';
import { QueueEntry } from 'piqueralink-shared';

export class QueueService {
  /**
   * Un conductor se une a la cola de una piquera.
   * Usa transacción para garantizar atomicidad en la asignación de posición.
   */
  async joinQueue(driverId: string, piqueraId: string) {
    return await prisma.$transaction(async (tx) => {
      // Verificar que la piquera existe y está activa
      const piquera = await tx.piquera.findUnique({
        where: { id: piqueraId },
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

      // Verificar que el conductor no esté ya en cola activa de esta piquera
      const existingTurn = await tx.turn.findFirst({
        where: {
          driverId,
          piqueraId,
          status: TurnStatus.active,
        },
      });

      if (existingTurn) {
        throw Object.assign(new Error('Ya estás en la cola de esta piquera'), {
          statusCode: 409,
          isOperational: true,
        });
      }

      // Verificar capacidad máxima
      const activeCount = await tx.turn.count({
        where: {
          piqueraId,
          status: TurnStatus.active,
        },
      });

      if (activeCount >= piquera.maxCapacity) {
        throw Object.assign(new Error('La cola está llena'), {
          statusCode: 400,
          isOperational: true,
        });
      }

      // Determinar siguiente posición (FIFO)
      const lastTurn = await tx.turn.findFirst({
        where: { piqueraId, status: TurnStatus.active },
        orderBy: { position: 'desc' },
      });

      const nextPosition = lastTurn ? lastTurn.position + 1 : 1;

      // Crear turno
      const turn = await tx.turn.create({
        data: {
          driverId,
          piqueraId,
          position: nextPosition,
          status: TurnStatus.active,
        },
        include: {
          driver: {
            select: { id: true, name: true },
            },
        },
      });

      // Emitir evento de actualización
      const queue = await this.getQueueEntries(tx, piqueraId);
      emitQueueStateChanged({ piqueraId, queue });

      return { turn, position: nextPosition };
    });
  }

  /**
   * Un conductor abandona la cola voluntariamente.
   * Recalcula posiciones de los conductores restantes.
   */
  async leaveQueue(driverId: string, piqueraId: string) {
    return await prisma.$transaction(async (tx) => {
      // Buscar turno activo del conductor en esta piquera
      const turn = await tx.turn.findFirst({
        where: {
          driverId,
          piqueraId,
          status: TurnStatus.active,
        },
      });

      if (!turn) {
        throw Object.assign(new Error('No estás en la cola de esta piquera'), {
          statusCode: 404,
          isOperational: true,
        });
      }

      // Marcar como removido
      await tx.turn.update({
        where: { id: turn.id },
        data: {
          status: TurnStatus.removed,
          removedAt: new Date(),
        },
      });

      // Recalcular posiciones de los que quedan
      await this.recalculatePositions(tx, piqueraId);

      // Emitir evento de actualización
      const queue = await this.getQueueEntries(tx, piqueraId);
      emitQueueStateChanged({ piqueraId, queue });

      return { message: 'Has abandonado la cola exitosamente' };
    });
  }

  /**
   * Obtener posición actual del conductor en la cola.
   */
  async getPosition(driverId: string, piqueraId: string) {
    const turn = await prisma.turn.findFirst({
      where: {
        driverId,
        piqueraId,
        status: TurnStatus.active,
      },
    });

    if (!turn) {
      throw Object.assign(new Error('No estás en la cola de esta piquera'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    // Contar cuántos hay antes
    const totalInQueue = await prisma.turn.count({
      where: { piqueraId, status: TurnStatus.active },
    });

    return {
      position: turn.position,
      totalInQueue,
      joinedAt: turn.joinedAt,
    };
  }

  /**
   * Ver estado completo de la cola de una piquera.
   */
  async getQueueStatus(piqueraId: string) {
    // Verificar que la piquera existe
    const piquera = await prisma.piquera.findUnique({
      where: { id: piqueraId },
    });

    if (!piquera) {
      throw Object.assign(new Error('Piquera no encontrada'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    const queue = await this.getQueueEntries(prisma, piqueraId);

    return {
      piquera: {
        id: piquera.id,
        name: piquera.name,
        maxCapacity: piquera.maxCapacity,
        isActive: piquera.isActive,
      },
      queue,
      totalInQueue: queue.length,
    };
  }

  /**
   * Obtener las entradas de la cola formateadas para el frontend.
   */
  private async getQueueEntries(
    tx: any,
    piqueraId: string
  ): Promise<QueueEntry[]> {
    const turns = await tx.turn.findMany({
      where: { piqueraId, status: TurnStatus.active },
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

    return turns.map((turn: any) => ({
      driverId: turn.driver.id,
      driverName: turn.driver.name,
      vehicle: turn.driver.vehicle || {
        id: '',
        plate: 'Sin vehículo',
        model: '',
        color: '',
        photoUrl: '',
      },
      position: turn.position,
      joinedAt: turn.joinedAt.toISOString(),
    }));
  }

  /**
   * Recalcular posiciones secuenciales después de una remoción.
   */
  private async recalculatePositions(tx: any, piqueraId: string) {
    const activeTurns = await tx.turn.findMany({
      where: { piqueraId, status: TurnStatus.active },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < activeTurns.length; i++) {
      const newPosition = i + 1;
      if (activeTurns[i].position !== newPosition) {
        await tx.turn.update({
          where: { id: activeTurns[i].id },
          data: { position: newPosition },
        });

        // Emitir posición individual
        emitPositionUpdate(piqueraId, {
          driverId: activeTurns[i].driverId,
          position: newPosition,
        });
      }
    }
  }
}

export const queueService = new QueueService();
