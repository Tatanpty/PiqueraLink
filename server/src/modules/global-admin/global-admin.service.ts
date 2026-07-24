import prisma from '../../config/database';
import { TurnStatus, TripStatus } from '@prisma/client';

export class GlobalAdminService {
  async getAllPiquerasWithMetrics() {
    const piqueras = await prisma.piquera.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            turns: { where: { status: TurnStatus.active } },
            tripRequests: true,
          },
        },
      },
    });

    const result = await Promise.all(
      piqueras.map(async (p) => {
        const tripsToday = await prisma.tripRequest.count({
          where: { piqueraId: p.id, createdAt: { gte: startOfToday() } },
        });
        const completedToday = await prisma.tripRequest.count({
          where: { piqueraId: p.id, status: TripStatus.completed, completedAt: { gte: startOfToday() } },
        });
        return {
          id: p.id,
          name: p.name,
          address: p.address,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          maxCapacity: p.maxCapacity,
          isActive: p.isActive,
          createdAt: p.createdAt,
          metrics: { driversInQueue: p._count.turns, totalTrips: p._count.tripRequests, tripsToday, completedToday },
        };
      })
    );
    return result;
  }

  async getPiqueraDetail(piqueraId: string) {
    const piquera = await prisma.piquera.findUnique({ where: { id: piqueraId } });
    if (!piquera) throw Object.assign(new Error('Piquera no encontrada'), { statusCode: 404, isOperational: true });

    const activeTurns = await prisma.turn.findMany({
      where: { piqueraId, status: TurnStatus.active },
      orderBy: { position: 'asc' },
      include: { driver: { select: { id: true, name: true, email: true, vehicle: { select: { plate: true, model: true, color: true } } } } },
    });

    const allDriversToday = await prisma.turn.findMany({
      where: { piqueraId, joinedAt: { gte: startOfToday() } },
      distinct: ['driverId'],
      include: { driver: { select: { id: true, name: true, email: true, vehicle: { select: { plate: true, model: true, color: true } } } } },
    });

    const recentTrips = await prisma.tripRequest.findMany({
      where: { piqueraId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { passenger: { select: { name: true } }, driver: { select: { name: true } } },
    });

    return {
      piquera: { id: piquera.id, name: piquera.name, address: piquera.address, maxCapacity: piquera.maxCapacity, isActive: piquera.isActive },
      currentQueue: activeTurns.map((t) => ({ position: t.position, driverId: t.driver.id, driverName: t.driver.name, driverEmail: t.driver.email, vehicle: t.driver.vehicle, joinedAt: t.joinedAt })),
      driversToday: allDriversToday.map((t) => ({ driverId: t.driver.id, driverName: t.driver.name, driverEmail: t.driver.email, vehicle: t.driver.vehicle, joinedAt: t.joinedAt, status: t.status })),
      recentTrips: recentTrips.map((trip) => ({ id: trip.id, status: trip.status, destination: trip.destination, passengerName: trip.passenger.name, driverName: trip.driver?.name || null, createdAt: trip.createdAt, completedAt: trip.completedAt })),
    };
  }

  async getSystemOverview() {
    const [totalPiqueras, activePiqueras, totalDrivers, totalPassengers, totalTripsToday, completedTripsToday, activeDriversNow] = await Promise.all([
      prisma.piquera.count(),
      prisma.piquera.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'driver' } }),
      prisma.user.count({ where: { role: 'passenger' } }),
      prisma.tripRequest.count({ where: { createdAt: { gte: startOfToday() } } }),
      prisma.tripRequest.count({ where: { status: TripStatus.completed, completedAt: { gte: startOfToday() } } }),
      prisma.turn.count({ where: { status: TurnStatus.active } }),
    ]);
    return { totalPiqueras, activePiqueras, totalDrivers, totalPassengers, totalTripsToday, completedTripsToday, activeDriversNow };
  }
}

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export const globalAdminService = new GlobalAdminService();
