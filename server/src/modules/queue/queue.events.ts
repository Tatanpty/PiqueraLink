import { Server as SocketIOServer } from 'socket.io';
import { QueueStatePayload, PositionUpdatePayload } from 'piqueralink-shared';

let io: SocketIOServer | null = null;

/**
 * Inicializar referencia al servidor Socket.IO.
 * Se llama una vez al arrancar la app.
 */
export function initQueueEvents(socketServer: SocketIOServer) {
  io = socketServer;
}

/**
 * Emitir estado completo actualizado de la cola
 * a todos los suscriptores de la piquera.
 */
export function emitQueueStateChanged(payload: QueueStatePayload) {
  if (!io) return;
  io.to(`piquera:${payload.piqueraId}`).emit('queue:state_changed', payload);
}

/**
 * Emitir actualización de posición individual a un conductor.
 */
export function emitPositionUpdate(
  piqueraId: string,
  payload: PositionUpdatePayload
) {
  if (!io) return;
  io.to(`piquera:${piqueraId}`).emit('queue:position_update', payload);
}
