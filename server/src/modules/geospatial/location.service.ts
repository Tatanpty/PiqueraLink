import prisma from '../../config/database';

interface LocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export class LocationService {
  /**
   * Actualizar o crear la ubicación de un conductor.
   */
  async updateLocation(data: LocationUpdate) {
    const location = await prisma.driverLocation.upsert({
      where: { driverId: data.driverId },
      update: {
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading ?? null,
        speed: data.speed ?? null,
      },
      create: {
        driverId: data.driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading ?? null,
        speed: data.speed ?? null,
      },
    });

    return location;
  }

  /**
   * Obtener la ubicación actual de un conductor.
   */
  async getDriverLocation(driverId: string) {
    return await prisma.driverLocation.findUnique({
      where: { driverId },
    });
  }

  /**
   * Obtener ubicaciones de todos los conductores activos de una piquera.
   */
  async getActiveDriverLocations(piqueraId: string) {
    const activeTurns = await prisma.turn.findMany({
      where: { piqueraId, status: 'active' },
      select: { driverId: true },
    });

    const driverIds = activeTurns.map((t) => t.driverId);

    if (driverIds.length === 0) return [];

    const locations = await prisma.driverLocation.findMany({
      where: { driverId: { in: driverIds } },
      include: {
        driver: {
          select: { id: true, name: true },
        },
      },
    });

    return locations.map((loc) => ({
      driverId: loc.driver.id,
      driverName: loc.driver.name,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      heading: loc.heading,
      speed: loc.speed,
      updatedAt: loc.updatedAt,
    }));
  }
}

export const locationService = new LocationService();
