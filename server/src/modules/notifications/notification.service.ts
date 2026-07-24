import { Server as SocketIOServer } from 'socket.io';
import prisma from '../../config/database';
import { NotificationType } from '@prisma/client';

let io: SocketIOServer | null = null;

/**
 * Inicializar referencia al servidor Socket.IO.
 */
export function initNotificationService(socketServer: SocketIOServer) {
  io = socketServer;
}

interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Enviar notificación a un usuario (persistir + push vía Socket.IO).
   */
  async send(input: SendNotificationInput) {
    // Persistir en la base de datos
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data || null,
      },
    });

    // Emitir vía Socket.IO al usuario
    if (io) {
      io.to(`user:${input.userId}`).emit('notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        createdAt: notification.createdAt.toISOString(),
      });
    }

    return notification;
  }

  /**
   * Enviar notificación a múltiples usuarios.
   */
  async sendBulk(userIds: string[], type: NotificationType, title: string, body: string, data?: Record<string, any>) {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        data: data || undefined,
      })),
    });

    // Emitir a cada usuario
    if (io) {
      for (const userId of userIds) {
        io.to(`user:${userId}`).emit('notification:new', {
          type,
          title,
          body,
          data,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return { sent: notifications.count };
  }

  /**
   * Obtener notificaciones de un usuario.
   */
  async getUserNotifications(userId: string, limit: number = 30) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Marcar notificación como leída.
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw Object.assign(new Error('Notificación no encontrada'), {
        statusCode: 404, isOperational: true,
      });
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Marcar todas como leídas.
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  /**
   * Contar notificaciones no leídas.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ========================
  // Helpers para eventos específicos
  // ========================

  async notifyDriverArrival(passengerId: string, driverName: string, plate: string) {
    return this.send({
      userId: passengerId,
      type: 'trip_update' as NotificationType,
      title: '🚗 Tu conductor ha llegado',
      body: `${driverName} (${plate}) te espera en el punto de recogida`,
      data: { event: 'driver_arrived' },
    });
  }

  async notifyQueuePosition(driverId: string, position: number, piqueraName: string) {
    return this.send({
      userId: driverId,
      type: 'queue_update' as NotificationType,
      title: '📋 Actualización de turno',
      body: `Posición #${position} en ${piqueraName}`,
      data: { event: 'queue_position', position },
    });
  }

  async notifyPromoAvailable(userId: string, promoCode: string, description: string) {
    return this.send({
      userId,
      type: 'promo' as NotificationType,
      title: '🎉 Promoción disponible',
      body: `Usa el código ${promoCode}: ${description}`,
      data: { event: 'promo_available', code: promoCode },
    });
  }
}

export const notificationService = new NotificationService();
