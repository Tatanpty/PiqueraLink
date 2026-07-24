import prisma from '../../config/database';
import { TurnStatus, TripStatus } from '@prisma/client';

export class MetricsService {
  /**
   * Métricas globales del sistema (solo super_admin).
   */
  async getGlobalMetrics() {
    const [
      totalPiqueras,
      activePiqueras,
      inactivePiqueras,
      totalVehicles,
      usersByRole,
      tripsByStatus,
      totalIncidents,
      piqueraDistribution,
    ] = await Promise.all([
      prisma.piquera.count(),
      prisma.piquera.count({ where: { isActive: true } }),
      prisma.piquera.count({ where: { isActive: false } }),
      prisma.vehicle.count(),
      this.getUsersByRole(),
      this.getTripsByStatus(),
      prisma.incident.count(),
      this.getPiqueraDistribution(),
    ]);

    return {
      piqueras: {
        total: totalPiqueras,
        active: activePiqueras,
        inactive: inactivePiqueras,
      },
      vehicles: {
        total: totalVehicles,
      },
      users: usersByRole,
      trips: tripsByStatus,
      incidents: {
        total: totalIncidents,
      },
      distribution: piqueraDistribution,
    };
  }

  /**
   * Métricas locales de una piquera específica.
   */
  async getPiqueraMetrics(piqueraId: string) {
    const piquera = await prisma.piquera.findUnique({
      where: { id: piqueraId },
    });

    if (!piquera) {
      throw Object.assign(new Error('Piquera no encontrada'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    const [
      turnsByStatus,
      totalDriversAffiliated,
      tripsByStatus,
      activeTurnsCount,
    ] = await Promise.all([
      this.getTurnsByStatusForPiquera(piqueraId),
      this.getDriversCountForPiquera(piqueraId),
      this.getTripsByStatusForPiquera(piqueraId),
      prisma.turn.count({ where: { piqueraId, status: TurnStatus.active } }),
    ]);

    return {
      piquera: {
        id: piquera.id,
        name: piquera.name,
        address: piquera.address,
        isActive: piquera.isActive,
        maxCapacity: piquera.maxCapacity,
        createdAt: piquera.createdAt,
      },
      drivers: {
        totalAffiliated: totalDriversAffiliated,
        activeInQueue: activeTurnsCount,
      },
      capacity: {
        max: piquera.maxCapacity,
        current: activeTurnsCount,
        available: piquera.maxCapacity - activeTurnsCount,
        utilizationPercent: Math.round((activeTurnsCount / piquera.maxCapacity) * 100),
      },
      turns: turnsByStatus,
      trips: tripsByStatus,
    };
  }

  // ========================
  // Helpers privados
  // ========================

  private async getUsersByRole() {
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const result: Record<string, number> = {
      passenger: 0,
      driver: 0,
      admin: 0,
      super_admin: 0,
      total: 0,
    };

    for (const group of counts) {
      result[group.role] = group._count.id;
      result.total += group._count.id;
    }

    return result;
  }

  private async getTripsByStatus() {
    const counts = await prisma.tripRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const result: Record<string, number> = {
      pending: 0,
      assigned: 0,
      accepted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    };

    for (const group of counts) {
      result[group.status] = group._count.id;
      result.total += group._count.id;
    }

    // Viajes activos = assigned + accepted + in_progress
    result.active = result.assigned + result.accepted + result.in_progress;

    return result;
  }

  private async getPiqueraDistribution() {
    const piqueras = await prisma.piquera.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        maxCapacity: true,
        _count: {
          select: {
            turns: true,
            tripRequests: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Para cada piquera obtener conductores activos actualmente
    const distribution = await Promise.all(
      piqueras.map(async (p) => {
        const activeDrivers = await prisma.turn.count({
          where: { piqueraId: p.id, status: TurnStatus.active },
        });

        const completedTrips = await prisma.tripRequest.count({
          where: { piqueraId: p.id, status: TripStatus.completed },
        });

        return {
          piqueraId: p.id,
          piqueraName: p.name,
          isActive: p.isActive,
          maxCapacity: p.maxCapacity,
          activeDrivers,
          totalTurnsHistoric: p._count.turns,
          totalTrips: p._count.tripRequests,
          completedTrips,
          utilizationPercent: p.maxCapacity > 0
            ? Math.round((activeDrivers / p.maxCapacity) * 100)
            : 0,
        };
      })
    );

    return distribution;
  }

  private async getTurnsByStatusForPiquera(piqueraId: string) {
    const counts = await prisma.turn.groupBy({
      by: ['status'],
      where: { piqueraId },
      _count: { id: true },
    });

    const result: Record<string, number> = {
      active: 0,
      in_service: 0,
      removed: 0,
      total: 0,
    };

    for (const group of counts) {
      result[group.status] = group._count.id;
      result.total += group._count.id;
    }

    return result;
  }

  private async getDriversCountForPiquera(piqueraId: string) {
    // Conductores únicos que han tenido turno en esta piquera
    const uniqueDrivers = await prisma.turn.findMany({
      where: { piqueraId },
      distinct: ['driverId'],
      select: { driverId: true },
    });

    return uniqueDrivers.length;
  }

  private async getTripsByStatusForPiquera(piqueraId: string) {
    const counts = await prisma.tripRequest.groupBy({
      by: ['status'],
      where: { piqueraId },
      _count: { id: true },
    });

    const result: Record<string, number> = {
      pending: 0,
      assigned: 0,
      accepted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    };

    for (const group of counts) {
      result[group.status] = group._count.id;
      result.total += group._count.id;
    }

    result.active = result.assigned + result.accepted + result.in_progress;

    return result;
  }
}

export const metricsService = new MetricsService();
