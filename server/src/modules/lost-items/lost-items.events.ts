import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initLostItemEvents(socketServer: SocketIOServer) {
  io = socketServer;
}

/**
 * Notificar al conductor que un pasajero reportó un objeto perdido.
 */
export function emitLostItemReported(driverId: string, data: {
  lostItemId: string;
  tripId: string;
  description: string;
  passengerName: string;
  createdAt: string;
}) {
  if (!io) return;
  io.to(`user:${driverId}`).emit('lost_item:reported', data);
}
