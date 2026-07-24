import prisma from '../../config/database';
import { haversineDistance } from '../../utils/geo';
import { Prisma } from '@prisma/client';

interface PiqueraRow {
  id: string;
  name: string;
  address: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  maxCapacity: number;
  isActive: boolean;
}

interface PiqueraWithDistance {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  maxCapacity: number;
  isActive: boolean;
  distanceKm: number;
}

export class PiquerasService {
  async getAll() {
    return await prisma.piquera.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        maxCapacity: true,
        isActive: true,
      },
    });
  }

  async getNearby(lat: number, lng: number): Promise<PiqueraWithDistance[]> {
    const piqueras: PiqueraRow[] = await prisma.piquera.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        maxCapacity: true,
        isActive: true,
      },
    });

    const withDistance: PiqueraWithDistance[] = piqueras.map((p: PiqueraRow) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      maxCapacity: p.maxCapacity,
      isActive: p.isActive,
      distanceKm: haversineDistance(lat, lng, Number(p.latitude), Number(p.longitude)),
    }));

    withDistance.sort((a: PiqueraWithDistance, b: PiqueraWithDistance) => a.distanceKm - b.distanceKm);
    return withDistance;
  }

  async getNearest(lat: number, lng: number): Promise<PiqueraWithDistance> {
    const sorted = await this.getNearby(lat, lng);
    if (sorted.length === 0) {
      throw Object.assign(new Error('No hay piqueras activas disponibles'), {
        statusCode: 404,
        isOperational: true,
      });
    }
    return sorted[0];
  }
}

export const piquerasService = new PiquerasService();
