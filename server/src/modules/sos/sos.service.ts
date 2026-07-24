import prisma from '../../config/database';
import { SOSType, SOSStatus } from '@prisma/client';

interface TriggerSOSInput {
  userId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  type: SOSType;
  description?: string;
}

export class SOSService {
  /**
   * Disparar una alerta SOS.
   */
  async triggerAlert(data: TriggerSOSInput) {
    const alert = await prisma.sOSAlert.create({
      data: {
        userId: data.userId,
        tripId: data.tripId || null,
        latitude: data.latitude,
        longitude: data.longitude,
        type: data.type,
        description: data.description || null,
        status: SOSStatus.active,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        trip: { select: { id: true, destination: true } },
      },
    });

    return alert;
  }

  /**
   * Obtener todas las alertas activas (para panel admin).
   */
  async getActiveAlerts() {
    return await prisma.sOSAlert.findMany({
      where: { status: { in: [SOSStatus.active, SOSStatus.acknowledged] } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        trip: { select: { id: true, destination: true, piqueraId: true } },
      },
    });
  }

  /**
   * Acusar recibo de una alerta (admin la está atendiendo).
   */
  async acknowledgeAlert(alertId: string, adminId: string) {
    const alert = await prisma.sOSAlert.findUnique({ where: { id: alertId } });

    if (!alert) {
      throw Object.assign(new Error('Alerta SOS no encontrada'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    if (alert.status !== SOSStatus.active) {
      throw Object.assign(new Error('La alerta ya fue atendida o resuelta'), {
        statusCode: 400,
        isOperational: true,
      });
    }

    return await prisma.sOSAlert.update({
      where: { id: alertId },
      data: {
        status: SOSStatus.acknowledged,
        resolvedBy: adminId,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Resolver/cerrar una alerta SOS.
   */
  async resolveAlert(alertId: string, adminId: string, isFalseAlarm: boolean = false) {
    const alert = await prisma.sOSAlert.findUnique({ where: { id: alertId } });

    if (!alert) {
      throw Object.assign(new Error('Alerta SOS no encontrada'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    if (alert.status === SOSStatus.resolved || alert.status === SOSStatus.false_alarm) {
      throw Object.assign(new Error('La alerta ya fue resuelta'), {
        statusCode: 400,
        isOperational: true,
      });
    }

    return await prisma.sOSAlert.update({
      where: { id: alertId },
      data: {
        status: isFalseAlarm ? SOSStatus.false_alarm : SOSStatus.resolved,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Historial de alertas SOS (para reportes).
   */
  async getAlertHistory(limit: number = 50) {
    return await prisma.sOSAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, role: true } },
        resolver: { select: { id: true, name: true } },
      },
    });
  }
}

export const sosService = new SOSService();
