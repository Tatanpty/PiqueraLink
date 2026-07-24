import { Request, Response, NextFunction } from 'express';
import { sosService } from './sos.service';
import { triggerSOSSchema, alertIdSchema, resolveSchema } from './sos.validators';
import { emitSOSTriggered, emitSOSResolved, emitSOSAcknowledged } from './sos.events';

export class SOSController {
  /**
   * POST /api/sos/trigger
   * Disparar alerta SOS (pasajero o conductor).
   */
  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const data = triggerSOSSchema.parse(req.body);
      const userId = req.user!.userId;

      const alert = await sosService.triggerAlert({
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
        type: data.type as any,
        tripId: data.tripId,
        description: data.description,
      });

      // Emitir a todos los admins
      emitSOSTriggered({
        id: alert.id,
        userId: alert.user.id,
        userName: alert.user.name,
        userRole: alert.user.role,
        latitude: data.latitude,
        longitude: data.longitude,
        type: alert.type,
        description: alert.description,
        tripId: alert.tripId,
        createdAt: alert.createdAt,
      });

      res.status(201).json({
        message: 'Alerta SOS activada. Ayuda en camino.',
        alert: {
          id: alert.id,
          status: alert.status,
          type: alert.type,
          createdAt: alert.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sos/active
   * Obtener alertas SOS activas (admin/super_admin).
   */
  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await sosService.getActiveAlerts();
      res.status(200).json(alerts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/sos/:alertId/acknowledge
   * Admin acusa recibo de la alerta.
   */
  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const { alertId } = alertIdSchema.parse(req.params);
      const adminId = req.user!.userId;

      const alert = await sosService.acknowledgeAlert(alertId, adminId);

      emitSOSAcknowledged({ id: alert.id, resolvedBy: adminId });

      res.status(200).json({
        message: 'Alerta reconocida — atendiendo',
        alert,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/sos/:alertId/resolve
   * Resolver/cerrar una alerta SOS.
   */
  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { alertId } = alertIdSchema.parse(req.params);
      const { isFalseAlarm } = resolveSchema.parse(req.body);
      const adminId = req.user!.userId;

      const alert = await sosService.resolveAlert(alertId, adminId, isFalseAlarm);

      emitSOSResolved({ id: alert.id, status: alert.status, resolvedBy: adminId });

      res.status(200).json({
        message: isFalseAlarm ? 'Alerta marcada como falsa alarma' : 'Alerta resuelta',
        alert,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sos/history
   * Historial de alertas (admin/super_admin).
   */
  async getHistory(_req: Request, res: Response, next: NextFunction) {
    try {
      const history = await sosService.getAlertHistory();
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }
}

export const sosController = new SOSController();
