import { Server as SocketIOServer, Socket } from 'socket.io';
import { locationService } from './location.service';
import { verifyToken } from '../../utils/token';

let io: SocketIOServer | null = null;

/**
 * Inicializar listeners de geolocalización en Socket.IO.
 */
export function initLocationEvents(socketServer: SocketIOServer) {
  io = socketServer;

  io.on('connection', (socket: Socket) => {
    // Escuchar actualizaciones de ubicación de conductores
    socket.on('location:update', async (data: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    }) => {
      try {
        // Extraer userId del auth del socket
        const token = socket.handshake.auth?.token;
        if (!token) return;

        const payload = verifyToken(token);
        if (payload.role !== 'driver') return;

        // Persistir en DB
        await locationService.updateLocation({
          driverId: payload.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          speed: data.speed,
        });

        // Re-emitir a admins suscritos a la piquera del conductor
        // (Los admins están en la room piquera:X)
        socket.broadcast.emit('location:driver_moved', {
          driverId: payload.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          speed: data.speed,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Silenciar errores de ubicación para no interrumpir el flujo
      }
    });
  });
}

/**
 * Emitir ubicación de un conductor a una sala de piquera.
 */
export function emitDriverLocation(piqueraId: string, data: {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}) {
  if (!io) return;
  io.to(`piquera:${piqueraId}`).emit('location:driver_moved', {
    ...data,
    timestamp: new Date().toISOString(),
  });
}
