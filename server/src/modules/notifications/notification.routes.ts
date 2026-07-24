import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { authenticate } from '../../middleware/authenticate';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

/**
 * GET /api/notifications
 * Obtener mis notificaciones.
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const notifications = await notificationService.getUserNotifications(userId);
      const unreadCount = await notificationService.getUnreadCount(userId);
      res.status(200).json({ notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/:id/read
 * Marcar una notificación como leída.
 */
router.patch(
  '/:id/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const userId = req.user!.userId;
      await notificationService.markAsRead(id, userId);
      res.status(200).json({ message: 'Marcada como leída' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/read-all
 * Marcar todas como leídas.
 */
router.patch(
  '/read-all',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.markAllAsRead(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
