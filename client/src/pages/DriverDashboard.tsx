import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { queueApi, tripsApi } from '../services/api';

interface TripAssignment {
  tripId: string;
  passenger: { name: string; destination: string };
  originLat: number;
  originLng: number;
}

export function DriverDashboard() {
  const { user, token, logout } = useAuthContext();
  const { on, isConnected } = useSocketContext();

  const [piqueraId, setPiqueraId] = useState('');
  const [isInQueue, setIsInQueue] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<TripAssignment | null>(null);
  const [tripAccepted, setTripAccepted] = useState(false);

  // Escuchar asignación de viaje
  useEffect(() => {
    const unsubTrip = on('trip:assigned', (data: TripAssignment) => {
      setCurrentTrip(data);
      setIsInQueue(false);
      setPosition(null);
    });

    const unsubPosition = on('queue:position_update', (data: any) => {
      if (data.driverId === user?.id) {
        setPosition(data.position);
      }
    });

    const unsubQueue = on('queue:state_changed', (data: any) => {
      setTotalInQueue(data.queue.length);
      const myEntry = data.queue.find((e: any) => e.driverId === user?.id);
      if (myEntry) {
        setPosition(myEntry.position);
      }
    });

    return () => {
      unsubTrip?.();
      unsubPosition?.();
      unsubQueue?.();
    };
  }, [on, user?.id]);

  const handleJoinQueue = async () => {
    if (!piqueraId) return;
    setError('');
    setIsLoading(true);

    try {
      const result = await queueApi.join(piqueraId, token!);
      setIsInQueue(true);
      setPosition(result.position);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!piqueraId) return;
    setError('');
    setIsLoading(true);

    try {
      await queueApi.leave(piqueraId, token!);
      setIsInQueue(false);
      setPosition(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTrip = async () => {
    if (!currentTrip) return;
    try {
      await tripsApi.accept(currentTrip.tripId, token!);
      setTripAccepted(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRejectTrip = async () => {
    if (!currentTrip) return;
    try {
      await tripsApi.reject(currentTrip.tripId, token!);
      setCurrentTrip(null);
      setTripAccepted(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    try {
      await tripsApi.complete(currentTrip.tripId, token!);
      setCurrentTrip(null);
      setTripAccepted(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-taxi-dark text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">🚗 Conductor</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <button onClick={logout} className="text-sm text-gray-300 hover:text-white">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Info del conductor */}
        <div className="card">
          <p className="text-gray-600">
            Hola, <span className="font-semibold">{user?.name}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Viaje activo */}
        {currentTrip && (
          <div className="card border-taxi-yellow bg-yellow-50">
            <h2 className="font-bold text-gray-900 mb-2">
              {tripAccepted ? '🚗 Viaje en curso' : '🔔 ¡Nuevo viaje asignado!'}
            </h2>
            <div className="space-y-2 mb-4">
              <p className="text-sm">
                <span className="font-medium">Pasajero:</span> {currentTrip.passenger.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Destino:</span> {currentTrip.passenger.destination}
              </p>
            </div>

            {!tripAccepted ? (
              <div className="flex gap-2">
                <button onClick={handleAcceptTrip} className="btn-primary flex-1">
                  ✅ Aceptar
                </button>
                <button onClick={handleRejectTrip} className="btn-danger flex-1">
                  ❌ Rechazar
                </button>
              </div>
            ) : (
              <button onClick={handleCompleteTrip} className="btn-primary w-full">
                🏁 Completar Viaje
              </button>
            )}
          </div>
        )}

        {/* Cola FIFO (solo si no hay viaje activo) */}
        {!currentTrip && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">Cola de la Piquera</h2>

            {!isInQueue ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="driver-piquera" className="block text-sm font-medium text-gray-700 mb-1">
                    ID de la Piquera
                  </label>
                  <input
                    id="driver-piquera"
                    type="text"
                    value={piqueraId}
                    onChange={(e) => setPiqueraId(e.target.value)}
                    className="input-field"
                    placeholder="UUID de la piquera"
                  />
                </div>
                <button
                  onClick={handleJoinQueue}
                  disabled={isLoading || !piqueraId}
                  className="btn-primary w-full"
                >
                  {isLoading ? 'Uniéndose...' : '📋 Unirse a la cola'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-green-700">{position}</p>
                  <p className="text-sm text-green-600">Tu posición en la cola</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalInQueue} conductor(es) en total
                  </p>
                </div>
                <button
                  onClick={handleLeaveQueue}
                  disabled={isLoading}
                  className="btn-danger w-full"
                >
                  Abandonar cola
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
