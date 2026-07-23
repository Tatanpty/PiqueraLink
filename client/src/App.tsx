import React, { useState } from 'react';
import { useAuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PassengerHome } from './pages/PassengerHome';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminPanel } from './pages/AdminPanel';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [showRegister, setShowRegister] = useState(false);

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🚕</div>
          <p className="text-gray-500">Cargando PiqueraLink...</p>
        </div>
      </div>
    );
  }

  // No autenticado: mostrar login o registro
  if (!isAuthenticated || !user) {
    if (showRegister) {
      return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
  }

  // Autenticado: enrutar según rol
  return (
    <SocketProvider>
      {user.role === 'passenger' && <PassengerHome />}
      {user.role === 'driver' && <DriverDashboard />}
      {user.role === 'admin' && <AdminPanel />}
    </SocketProvider>
  );
}

export default function App() {
  return <AppContent />;
}
