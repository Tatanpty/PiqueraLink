import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restaurar sesión desde localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem('piqueralink_token');
    const storedUser = localStorage.getItem('piqueralink_user');

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('piqueralink_token');
        localStorage.removeItem('piqueralink_user');
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem('piqueralink_token', token);
    localStorage.setItem('piqueralink_user', JSON.stringify(user));
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('piqueralink_token');
    localStorage.removeItem('piqueralink_user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return { ...state, login, logout };
}
