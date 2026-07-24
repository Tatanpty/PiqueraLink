import prisma from '../../config/database';
import { TripStatus } from '@prisma/client';

export class DriverAnalyticsService {
  /**
   * Obtener métricas completas del conductor.
   */
  async getDriverAnalytics(driverId: string) {
    const user = await prisma.user.findUnique({
      where: { id: driverId },
      select: { ratingAverage: true, ratingCount: true },
    });

    if (!user) {
      throw Object.assign(new Error('Conductor no encontrado'), {
        statusCode: 404, isOperational: true,
      });
    }

    // Total viajes completados
    const totalCompleted = await prisma.tripRequest.count({
      where: { driverId, status: TripStatus.completed },
    });

    // Total viajes cancelados (rechazados por el conductor)
    const totalCancelled = await prisma.tripRequest.count({
      where: { driverId, status: TripStatus.cancelled },
    });

    const totalAssigned = totalCompleted + totalCancelled;
    const cancellationRate = totalAssigned > 0
      ? Math.round((totalCancelled / totalAssigned) * 100)
      : 0;

    // Horas pico más rentables (viajes completados agrupados por hora)
    const completedTrips = await prisma.tripRequest.findMany({
      where: { driverId, status: TripStatus.completed },
      select: { completedAt: true },
    });

    const hourDistribution: Record<number, number> = {};
    for (const trip of completedTrips) {
      if (trip.completedAt) {
        const hour = trip.completedAt.getHours();
        hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
      }
    }

    // Top 5 horas más rentables
    const peakHours = Object.entries(hourDistribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), trips: count }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5);

    // Viajes de la semana actual
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const tripsThisWeek = await prisma.tripRequest.count({
      where: {
        driverId,
        status: TripStatus.completed,
        completedAt: { gte: startOfWeek },
      },
    });

    // Viajes hoy
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tripsToday = await prisma.tripRequest.count({
      where: {
        driverId,
        status: TripStatus.completed,
        completedAt: { gte: startOfDay },
      },
    });

    // Distribución por día de la semana
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weeklyDistribution = dayNames.map((name, index) => {
      const count = completedTrips.filter((t) => t.completedAt?.getDay() === index).length;
      return { day: name, trips: count };
    });

    return {
      totalTrips: totalCompleted,
      tripsToday,
      tripsThisWeek,
      cancellationRate,
      totalCancelled,
      rating: {
        average: user.ratingAverage,
        totalReviews: user.ratingCount,
      },
      peakHours,
      weeklyDistribution,
    };
  }
}

export const driverAnalyticsService = new DriverAnalyticsService();
