import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  token: string | null;
  userId?: string;
  piqueraId?: string;
  tripId?: string;
}

export function useSocket(options: UseSocketOptions) {
  const { token, userId, piqueraId, tripId } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Conectar al servidor Socket.IO
    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);

      // Unirse a rooms según contexto
      if (userId) {
        socket.emit('join:user', userId);
      }
      if (piqueraId) {
        socket.emit('join:piquera', piqueraId);
      }
      if (tripId) {
        socket.emit('join:trip', tripId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, userId, piqueraId, tripId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, isConnected, on, emit };
}
