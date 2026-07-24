import prisma from '../../config/database';
import { AccountStatus, TripStatus } from '@prisma/client';
import { ExportReportQuery } from './admin-tools.validators';

export class AdminToolsService {
  /**
   * Generar datos de reporte filtrados.
   */
  async generateReport(query: ExportReportQuery) {
    const { startDate, endDate, piqueraId } = query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const whereTrips: any = {
      status: TripStatus.completed,
    };
    if (Object.keys(dateFilter).length > 0) whereTrips.completedAt = dateFilter;
    if (piqueraId) whereTrips.piqueraId = piqueraId;

    // Viajes completados
    const trips = await prisma.tripRequest.findMany({
      where: whereTrips,
      orderBy: { completedAt: 'desc' },
      include: {
        passenger: { select: { name: true } },
        driver: { select: { name: true, vehicle: { select: { plate: true } } } },
        piquera: { select: { name: true } },
      },
    });

    // Métricas de resumen
    const totalTrips = trips.length;
    const totalRevenue = totalTrips * 25; // Tarifa base simplificada

    // Rendimiento por conductor
    const driverPerformance: Record<string, { name: string; trips: number; plate: string }> = {};
    for (const trip of trips) {
      if (trip.driver) {
        const dId = trip.driverId!;
        if (!driverPerformance[dId]) {
          driverPerformance[dId] = {
            name: trip.driver.name,
            plate: trip.driver.vehicle?.plate || 'N/A',
            trips: 0,
          };
        }
        driverPerformance[dId].trips++;
      }
    }

    // Volumen por piquera
    const piqueraVolume: Record<string, { name: string; trips: number }> = {};
    for (const trip of trips) {
      const pId = trip.piqueraId;
      if (!piqueraVolume[pId]) {
        piqueraVolume[pId] = { name: trip.piquera.name, trips: 0 };
      }
      piqueraVolume[pId].trips++;
    }

    return {
      summary: {
        totalTrips,
        totalRevenue,
        period: {
          start: startDate || 'Inicio',
          end: endDate || 'Actual',
        },
        piqueraFilter: piqueraId || 'Todas',
      },
      drivers: Object.values(driverPerformance).sort((a, b) => b.trips - a.trips),
      piqueras: Object.values(piqueraVolume).sort((a, b) => b.trips - a.trips),
      trips: trips.map((t) => ({
        id: t.id,
        passenger: t.passenger.name,
        driver: t.driver?.name || 'N/A',
        plate: t.driver?.vehicle?.plate || 'N/A',
        piquera: t.piquera.name,
        destination: t.destination,
        completedAt: t.completedAt,
      })),
    };
  }

  /**
   * Convertir datos del reporte a formato CSV.
   */
  generateCSV(reportData: any): string {
    const lines: string[] = [];

    // Header
    lines.push('ID,Pasajero,Conductor,Placa,Piquera,Destino,Completado');

    // Rows
    for (const trip of reportData.trips) {
      lines.push([
        trip.id,
        `"${trip.passenger}"`,
        `"${trip.driver}"`,
        trip.plate,
        `"${trip.piquera}"`,
        `"${trip.destination}"`,
        trip.completedAt ? new Date(trip.completedAt).toISOString() : '',
      ].join(','));
    }

    return lines.join('\n');
  }

  /**
   * Actualizar el estado de cuenta de un usuario.
   */
  async updateUserStatus(userId: string, status: AccountStatus, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    // No permitir bloquear a super_admins
    if (user.role === 'super_admin') {
      throw Object.assign(new Error('No se puede modificar el estado de un Super Admin'), {
        statusCode: 403,
        isOperational: true,
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        updatedAt: true,
      },
    });

    return {
      user: updated,
      action: status,
      reason: reason || null,
    };
  }

  /**
   * Listar usuarios con filtros (para panel admin).
   */
  async listUsers(filters?: { role?: string; status?: string }) {
    const where: any = {};
    if (filters?.role) where.role = filters.role;
    if (filters?.status) where.accountStatus = filters.status;

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        ratingAverage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const adminToolsService = new AdminToolsService();
