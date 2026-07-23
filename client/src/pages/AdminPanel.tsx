import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { queueApi } from '../services/api';

interface QueueEntry {
  driverId: string;
  driverName: string;
  vehicle: {
    plate: string;
    model: string;
    color: string;
  };
  position: number;
  joinedAt: string;
}

export function AdminPanel() {
  const { user, token, logout } = useAuthContext();
  const { on, isConnected } = useSocketContext();

  const [piqueraId, setPiqueraId] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [piqueraInfo, setPiqueraInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Escuchar actualizaciones de cola en tiempo real
  useEffect(() => {
    const unsub = on('queue:state_changed', (data: any) => {
      if (data.piqueraId === piqueraId) {
        setQueue(data.queue);
      }
    });

    return () => {
      unsub?.();
    };
  }, [on, piqueraId]);

  const handleLoadQueue = async () => {
    if (!piqueraId) return;
    setError('');
    setIsLoading(true);

    try {
      const result = await queueApi.getStatus(piqueraId, token!);
      setQueue(result.queue);
      setPiqueraInfo(result.piquera);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">📋 Panel Administrador</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{user?.name}</span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <button onClick={logout} className="text-sm text-gray-300 hover:text-white">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Selector de piquera */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Monitorear Piquera</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={piqueraId}
              onChange={(e) => setPiqueraId(e.target.value)}
              className="input-field flex-1"
              placeholder="ID de la piquera a monitorear"
            />
            <button
              onClick={handleLoadQueue}
              disabled={isLoading || !piqueraId}
              className="btn-primary"
            >
              {isLoading ? '...' : 'Cargar'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        {/* Info de la piquera */}
        {piqueraInfo && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{piqueraInfo.name}</h3>
                <p className="text-sm text-gray-500">
                  Capacidad: {queue.length}/{piqueraInfo.maxCapacity}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  piqueraInfo.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {piqueraInfo.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        )}

        {/* Cola en tiempo real */}
        {piqueraInfo && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">
              Fila Virtual ({queue.length} conductores)
            </h3>

            {queue.length === 0 ? (
              <p className="text-gray-400 text-center py-6">
                No hay conductores en la cola
              </p>
            ) : (
              <div className="space-y-2">
                {queue.map((entry) => (
                  <div
                    key={entry.driverId}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {entry.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {entry.driverName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.vehicle.plate} • {entry.vehicle.model} • {entry.vehicle.color}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(entry.joinedAt).toLocaleTimeString('es', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
