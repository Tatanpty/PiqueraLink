import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuthContext } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  on: (event: string, handler: (...args: any[]) => void) => (() => void) | undefined;
  emit: (event: string, data?: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuthContext();

  const { isConnected, on, emit } = useSocket({
    token,
    userId: user?.id,
  });

  return (
    <SocketContext.Provider value={{ isConnected, on, emit }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextType {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext debe usarse dentro de SocketProvider');
  }
  return context;
}
