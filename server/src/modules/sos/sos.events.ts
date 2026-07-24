import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * Inicializar referencia al servidor Socket.IO para SOS.
 */
export function initSOSEvents(socketServer: SocketIOServer) {
  io = socketServer;
}

/**
 * Emitir alerta SOS a todos los admins y super_admins.
 * Se emite a la room global 'admins'.
 */
export function emitSOSTriggered(alert: {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string | null;
  tripId: string | null;
  createdAt: Date;
}) {
  if (!io) return;
  io.to('admins').emit('sos:triggered', {
    ...alert,
    latitude: Number(alert.latitude),
    longitude: Number(alert.longitude),
    createdAt: alert.createdAt.toISOString ? alert.createdAt.toISOString() : alert.createdAt,
  });
}

/**
 * Emitir actualización de ubicación SOS (streaming mientras alerta activa).
 */
export function emitSOSLocationUpdate(alertId: string, data: {
  latitude: number;
  longitude: number;
}) {
  if (!io) return;
  io.to('admins').emit('sos:location_update', {
    alertId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emitir que una alerta fue resuelta.
 */
export function emitSOSResolved(alert: {
  id: string;
  status: string;
  resolvedBy: string | null;
}) {
  if (!io) return;
  io.to('admins').emit('sos:resolved', alert);
}

/**
 * Emitir que una alerta fue reconocida/aceptada por un admin.
 */
export function emitSOSAcknowledged(alert: {
  id: string;
  resolvedBy: string | null;
}) {
  if (!io) return;
  io.to('admins').emit('sos:acknowledged', alert);
}
