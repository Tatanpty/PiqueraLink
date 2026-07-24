import prisma from '../../config/database';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 4; // Los links expiran en 4 horas

export class TripShareService {
  /**
   * Generar un token de compartir para un viaje activo.
   */
  async generateShareToken(tripId: string, passengerId: string) {
    // Verificar que el viaje pertenece al pasajero
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw Object.assign(new Error('Viaje no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    if (trip.passengerId !== passengerId) {
      throw Object.assign(new Error('No tienes acceso a este viaje'), {
        statusCode: 403,
        isOperational: true,
      });
    }

    // Verificar que el viaje está en un estado compartible
    const shareableStatuses = ['assigned', 'accepted', 'in_progress'];
    if (!shareableStatuses.includes(trip.status)) {
      throw Object.assign(new Error('Solo puedes compartir viajes activos'), {
        statusCode: 400,
        isOperational: true,
      });
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    const shareToken = await prisma.tripShareToken.create({
      data: {
        tripId,
        token,
        expiresAt,
      },
    });

    return {
      token: shareToken.token,
      expiresAt: shareToken.expiresAt,
      shareUrl: `/trip/live/${shareToken.token}`,
    };
  }

  /**
   * Obtener información pública del viaje mediante token (sin auth).
   */
  async getTripByShareToken(token: string) {
    const shareToken = await prisma.tripShareToken.findUnique({
      where: { token },
      include: {
        trip: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                profilePhotoUrl: true,
                vehicle: {
                  select: {
                    plate: true,
                    model: true,
                    color: true,
                    photoUrl: true,
                  },
                },
              },
            },
            piquera: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!shareToken) {
      throw Object.assign(new Error('Enlace de viaje no válido'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    // Verificar expiración
    if (new Date() > shareToken.expiresAt) {
      throw Object.assign(new Error('Este enlace ha expirado'), {
        statusCode: 410,
        isOperational: true,
      });
    }

    const trip = shareToken.trip;

    // Obtener ubicación actual del conductor si existe
    let driverLocation = null;
    if (trip.driverId) {
      const loc = await prisma.driverLocation.findUnique({
        where: { driverId: trip.driverId },
      });
      if (loc) {
        driverLocation = {
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          updatedAt: loc.updatedAt,
        };
      }
    }

    return {
      tripId: trip.id,
      status: trip.status,
      destination: trip.destination,
      piqueraName: trip.piquera.name,
      driver: trip.driver
        ? {
            name: trip.driver.name,
            profilePhotoUrl: trip.driver.profilePhotoUrl,
            vehicle: trip.driver.vehicle,
          }
        : null,
      driverLocation,
      createdAt: trip.createdAt,
    };
  }
}

export const tripShareService = new TripShareService();
