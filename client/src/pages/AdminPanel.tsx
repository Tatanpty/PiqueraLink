import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { queueApi, piquerasApi } from '../services/api';

// ========================
// Types
// ========================

interface QueueEntry {
  driverId: string;
  driverName: string;
  vehicle: { plate: string; model: string; color: string };
  position: number;
  joinedAt: string;
}

interface PiqueraMetrics {
  piquera: {
    id: string;
    name: string;
    address: string;
    isActive: boolean;
    maxCapacity: number;
  };
  drivers: { totalAffiliated: number; activeInQueue: number };
  capacity: { max: number; current: number; available: number; utilizationPercent: number };
  turns: { active: number; in_service: number; removed: number; total: number };
  trips: { pending: number; assigned: number; accepted: number; in_progress: number; completed: number; cancelled: number; total: number; active: number };
}

// ========================
// Main Component
// ========================

export function AdminPanel() {
  const { user, token, logout } = useAuthContext();
  const { on, isConnected } = useSocketContext();

  const [piqueraId, setPiqueraId] = useState('');
  const [metrics, setMetrics] = useState<PiqueraMetrics | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'fleet'>('dashboard');

  // Real-time queue updates
  useEffect(() => {
    const unsub = on('queue:state_changed', (data: any) => {
      if (metrics && data.piqueraId === metrics.piquera.id) {
        setQueue(data.queue);
      }
    });
    return () => { unsub?.(); };
  }, [on, metrics]);

  const handleLoadPiquera = async () => {
    if (!piqueraId || !token) return;
    setError('');
    setIsLoading(true);
    try {
      const [metricsData, queueData] = await Promise.all([
        piquerasApi.getMetrics(piqueraId, token),
        queueApi.getStatus(piqueraId, token),
      ]);
      setMetrics(metricsData);
      setQueue(queueData.queue);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // If no piquera selected yet
  // ========================
  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <span className="text-4xl">📋</span>
            <h1 className="text-xl font-bold text-gray-900 mt-3">Panel de Administración</h1>
            <p className="text-sm text-gray-500 mt-1">Selecciona tu piquera para comenzar</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              value={piqueraId}
              onChange={(e) => setPiqueraId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="ID de tu piquera"
            />
            <button
              onClick={handleLoadPiquera}
              disabled={isLoading || !piqueraId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Cargando...' : 'Acceder al Panel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // Dashboard loaded
  // ========================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-50 hidden lg:flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚕</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">PiqueraLink</h1>
              <p className="text-xs text-gray-400">Administración Local</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {([
            { id: 'dashboard' as const, icon: '📊', label: 'Dashboard' },
            { id: 'queue' as const, icon: '📋', label: 'Turnos' },
            { id: 'fleet' as const, icon: '🚗', label: 'Flota' },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{metrics.piquera.name}</h2>
              <p className="text-sm text-gray-500">{metrics.piquera.address}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                metrics.piquera.isActive
                  ? 'bg-green-50 text-green-700 border-green-100'
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {metrics.piquera.isActive ? '● Activa' : '● Inactiva'}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Conectado' : 'Desconectado'} />
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeTab === 'dashboard' && <DashboardTab metrics={metrics} queue={queue} />}
          {activeTab === 'queue' && <QueueTab queue={queue} metrics={metrics} />}
          {activeTab === 'fleet' && <FleetTab metrics={metrics} queue={queue} />}
        </main>
      </div>
    </div>
  );
}

// ========================
// Tab: Dashboard
// ========================

function DashboardTab({ metrics, queue }: { metrics: PiqueraMetrics; queue: QueueEntry[] }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <LocalKPICard
          icon="📍"
          iconBg="bg-indigo-50 text-indigo-600"
          title="Estado de Piquera"
          value={metrics.piquera.isActive ? 'Activa' : 'Inactiva'}
          detail={`Capacidad: ${metrics.capacity.current}/${metrics.capacity.max}`}
        />
        <LocalKPICard
          icon="🚗"
          iconBg="bg-blue-50 text-blue-600"
          title="Taxis Adscritos"
          value={String(metrics.drivers.totalAffiliated)}
          detail={`${metrics.drivers.activeInQueue} activos en cola`}
        />
        <LocalKPICard
          icon="🎫"
          iconBg="bg-green-50 text-green-600"
          title="Viajes Gestionados"
          value={String(metrics.trips.total)}
          detail={`${metrics.trips.completed} completados • ${metrics.trips.cancelled} cancelados`}
        />
        <LocalKPICard
          icon="⚡"
          iconBg="bg-amber-50 text-amber-600"
          title="Viajes Activos"
          value={String(metrics.trips.active)}
          detail={`${metrics.trips.pending} pendientes`}
        />
      </div>

      {/* Capacity gauge */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Capacidad Operativa</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={metrics.capacity.utilizationPercent >= 80 ? 'text-red-500' : metrics.capacity.utilizationPercent >= 50 ? 'text-yellow-500' : 'text-green-500'}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${metrics.capacity.utilizationPercent}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{metrics.capacity.utilizationPercent}%</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ocupados</span>
              <span className="font-semibold text-gray-900">{metrics.capacity.current}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Disponibles</span>
              <span className="font-semibold text-green-600">{metrics.capacity.available}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Máxima</span>
              <span className="font-semibold text-gray-900">{metrics.capacity.max}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Turns breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Estado de Turnos</h3>
          <div className="space-y-3">
            <TurnStatusRow label="Activos" count={metrics.turns.active} color="bg-green-500" icon="🟢" />
            <TurnStatusRow label="En servicio" count={metrics.turns.in_service} color="bg-blue-500" icon="🔵" />
            <TurnStatusRow label="Removidos" count={metrics.turns.removed} color="bg-gray-400" icon="⚪" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Total histórico</span>
            <span className="font-semibold text-gray-900">{metrics.turns.total}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Solicitudes de Viaje</h3>
          <div className="space-y-3">
            <TurnStatusRow label="Completados" count={metrics.trips.completed} color="bg-green-500" icon="✅" />
            <TurnStatusRow label="Activos" count={metrics.trips.active} color="bg-blue-500" icon="🚗" />
            <TurnStatusRow label="Cancelados" count={metrics.trips.cancelled} color="bg-red-400" icon="❌" />
            <TurnStatusRow label="Pendientes" count={metrics.trips.pending} color="bg-yellow-400" icon="⏳" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// Tab: Queue (Turnos)
// ========================

function QueueTab({ queue, metrics }: { queue: QueueEntry[]; metrics: PiqueraMetrics }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{queue.length}</p>
          <p className="text-sm text-gray-500 mt-1">En cola activa</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{metrics.turns.in_service}</p>
          <p className="text-sm text-gray-500 mt-1">En servicio</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{metrics.capacity.available}</p>
          <p className="text-sm text-gray-500 mt-1">Espacios libres</p>
        </div>
      </div>

      {/* Queue table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Cola en Tiempo Real</h3>
          <span className="text-xs text-gray-400">Actualización automática</span>
        </div>

        {queue.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="text-4xl">🚗</span>
            <p className="text-gray-400 mt-3">No hay conductores en la cola</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3 font-medium">Posición</th>
                  <th className="px-6 py-3 font-medium">Conductor</th>
                  <th className="px-6 py-3 font-medium">Vehículo</th>
                  <th className="px-6 py-3 font-medium">Placa</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Ingreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queue.map((entry) => (
                  <tr key={entry.driverId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="w-8 h-8 bg-indigo-50 text-indigo-700 rounded-full inline-flex items-center justify-center text-sm font-bold">
                        {entry.position}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {entry.driverName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{entry.driverName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {entry.vehicle.model} • {entry.vehicle.color}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                        {entry.vehicle.plate}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {new Date(entry.joinedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// Tab: Fleet (Flota)
// ========================

function FleetTab({ metrics, queue }: { metrics: PiqueraMetrics; queue: QueueEntry[] }) {
  return (
    <div className="space-y-6">
      {/* Fleet overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">🚗</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.drivers.totalAffiliated}</p>
              <p className="text-sm text-gray-500">Total conductores afiliados</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-green-600">{metrics.drivers.activeInQueue}</p>
              <p className="text-sm text-gray-500">Activos en cola ahora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Conductores en Turno</h3>
        </div>

        {queue.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400">Sin conductores en turno actualmente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {queue.map((entry) => (
              <div key={entry.driverId} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-sm font-bold text-indigo-700">
                    #{entry.position}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{entry.driverName}</p>
                    <p className="text-xs text-gray-400">En cola desde {new Date(entry.joinedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Placa</span>
                    <span className="font-mono font-semibold text-gray-900">{entry.vehicle.plate}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Modelo</span>
                    <span className="text-gray-700">{entry.vehicle.model}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Color</span>
                    <span className="text-gray-700">{entry.vehicle.color}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// Sub-components
// ========================

function LocalKPICard({ icon, iconBg, title, value, detail }: { icon: string; iconBg: string; title: string; value: string; detail: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 ${iconBg}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-700 font-medium mt-0.5">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

function TurnStatusRow({ label, count, color, icon }: { label: string; count: number; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{icon}</span>
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <span className="font-semibold text-gray-900 text-sm">{count}</span>
    </div>
  );
}
