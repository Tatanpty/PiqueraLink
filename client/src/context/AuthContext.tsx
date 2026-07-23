import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  return context;
}
