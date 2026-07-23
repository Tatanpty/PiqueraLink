import { Server as SocketIOServer } from 'socket.io';
import {
  TripAssignedPayload,
  DriverInfoPayload,
  TripStatusPayload,
} from 'piqueralink-shared';

let io: SocketIOServer | null = null;

/**
 * Inicializar referencia al servidor Socket.IO.
 */
export function initTripEvents(socketServer: SocketIOServer) {
  io = socketServer;
}

/**
 * Notificar al conductor que le fue asignado un viaje.
 * Se emite a la room `user:{driverId}`.
 */
export function emitTripAssigned(driverId: string, payload: TripAssignedPayload) {
  if (!io) return;
  io.to(`user:${driverId}`).emit('trip:assigned', payload);
}

/**
 * Enviar al pasajero la información del conductor asignado.
 * Se emite a la room `user:{passengerId}`.
 */
export function emitDriverInfo(passengerId: string, payload: DriverInfoPayload) {
  if (!io) return;
  io.to(`user:${passengerId}`).emit('trip:driver_info', payload);
}

/**
 * Emitir cambio de estado de un viaje a todos los interesados.
 * Se emite a la room `trip:{tripId}`.
 */
export function emitTripStatusChanged(tripId: string, payload: TripStatusPayload) {
  if (!io) return;
  io.to(`trip:${tripId}`).emit('trip:status_changed', payload);
}
