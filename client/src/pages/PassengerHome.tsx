import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { tripsApi, queueApi } from '../services/api';

interface DriverInfo {
  id: string;
  name: string;
  vehicle: {
    plate: string;
    model: string;
    color: string;
    photoUrl: string;
  };
  estimatedMinutes: number;
}

export function PassengerHome() {
  const { user, token, logout } = useAuthContext();
  const { on, isConnected } = useSocketContext();
  const { position, error: geoError, isLoading: geoLoading } = useGeolocation();

  const [destination, setDestination] = useState('');
  const [piqueraId, setPiqueraId] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');
  const [assignedDriver, setAssignedDriver] = useState<DriverInfo | null>(null);
  const [tripStatus, setTripStatus] = useState<string | null>(null);
  const [queueInfo, setQueueInfo] = useState<any>(null);

  // Escuchar eventos de viaje en tiempo real
  useEffect(() => {
    const unsubDriver = on('trip:driver_info', (data: any) => {
      setAssignedDriver({
        id: data.driver.id,
        name: data.driver.name,
        vehicle: data.vehicle,
        estimatedMinutes: data.estimatedMinutes,
      });
      setTripStatus('assigned');
    });

    const unsubStatus = on('trip:status_changed', (data: any) => {
      setTripStatus(data.status);
      if (data.status === 'completed' || data.status === 'cancelled') {
        setTimeout(() => {
          setAssignedDriver(null);
          setTripStatus(null);
        }, 3000);
      }
    });

    return () => {
      unsubDriver?.();
      unsubStatus?.();
    };
  }, [on]);

  // Cargar estado de la cola cuando se selecciona una piquera
  useEffect(() => {
    if (piqueraId && token) {
      queueApi.getStatus(piqueraId, token).then(setQueueInfo).catch(() => {});
    }
  }, [piqueraId, token]);

  const handleRequestTrip = async () => {
    if (!position || !piqueraId || !destination) return;
    setError('');
    setIsRequesting(true);

    try {
      await tripsApi.request(
        {
          piqueraId,
          originLat: position.latitude,
          originLng: position.longitude,
          destination,
        },
        token!
      );
    } catch (err: any) {
      setError(err.message || 'Error al solicitar viaje');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">🚕 PiqueraLink</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Saludo */}
        <div className="card">
          <p className="text-gray-600">Hola, <span className="font-semibold">{user?.name}</span></p>
          {geoLoading && <p className="text-sm text-gray-400 mt-1">📍 Obteniendo ubicación...</p>}
          {geoError && <p className="text-sm text-red-500 mt-1">⚠️ {geoError}</p>}
          {position && (
            <p className="text-xs text-gray-400 mt-1">
              📍 {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
            </p>
          )}
        </div>

        {/* Si hay un viaje activo, mostrar info del conductor */}
        {assignedDriver && (
          <div className="card border-primary-200 bg-primary-50">
            <h2 className="font-semibold text-primary-800 mb-3">
              {tripStatus === 'assigned' && '🚗 Conductor asignado'}
              {tripStatus === 'accepted' && '✅ Conductor en camino'}
              {tripStatus === 'completed' && '🎉 Viaje completado'}
              {tripStatus === 'cancelled' && '❌ Viaje cancelado'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                🧑‍✈️
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{assignedDriver.name}</p>
                <p className="text-sm text-gray-600">
                  {assignedDriver.vehicle.model} • {assignedDriver.vehicle.color}
                </p>
                <p className="text-sm font-bold text-primary-700">
                  🚘 {assignedDriver.vehicle.plate}
                </p>
              </div>
            </div>
            {tripStatus === 'assigned' && (
              <p className="text-sm text-primary-600 mt-3">
                ⏱️ Tiempo estimado: ~{assignedDriver.estimatedMinutes} min
              </p>
            )}
          </div>
        )}

        {/* Formulario de solicitud (solo si no hay viaje activo) */}
        {!assignedDriver && (
          <>
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-3">Solicitar un taxi</h2>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="piquera" className="block text-sm font-medium text-gray-700 mb-1">
                    Piquera
                  </label>
                  <input
                    id="piquera"
                    type="text"
                    value={piqueraId}
                    onChange={(e) => setPiqueraId(e.target.value)}
                    className="input-field"
                    placeholder="ID de la piquera"
                  />
                </div>

                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                    ¿A dónde vas?
                  </label>
                  <input
                    id="destination"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="input-field"
                    placeholder="Ej: Centro Comercial, Hospital..."
                  />
                </div>

                <button
                  onClick={handleRequestTrip}
                  disabled={isRequesting || !position || !piqueraId || !destination}
                  className="btn-primary w-full"
                >
                  {isRequesting ? 'Solicitando...' : '🚕 Solicitar Taxi'}
                </button>
              </div>
            </div>

            {/* Info de la cola */}
            {queueInfo && (
              <div className="card">
                <h3 className="font-medium text-gray-700 mb-2">
                  📋 Cola: {queueInfo.piquera?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {queueInfo.totalInQueue} conductor(es) disponible(s)
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
