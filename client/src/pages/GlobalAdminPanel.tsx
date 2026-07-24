import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { metricsApi, globalAdminApi } from '../services/api';

// ========================
// Types
// ========================

interface GlobalMetrics {
  piqueras: { total: number; active: number; inactive: number };
  vehicles: { total: number };
  users: { passenger: number; driver: number; admin: number; super_admin: number; total: number };
  trips: { pending: number; assigned: number; accepted: number; in_progress: number; completed: number; cancelled: number; total: number; active: number };
  incidents: { total: number };
  distribution: PiqueraDistribution[];
}

interface PiqueraDistribution {
  piqueraId: string;
  piqueraName: string;
  isActive: boolean;
  maxCapacity: number;
  activeDrivers: number;
  totalTurnsHistoric: number;
  totalTrips: number;
  completedTrips: number;
  utilizationPercent: number;
}

// ========================
// Main Component
// ========================

export function GlobalAdminPanel() {
  const { user, token, logout } = useAuthContext();
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'piqueras' | 'health'>('overview');

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    metricsApi.getGlobal(token)
      .then((data) => setMetrics(data))
      .catch((err) => setError(err.message || 'Error al cargar métricas'))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando analíticas globales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-50 hidden lg:flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚕</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">PiqueraLink</h1>
              <p className="text-xs text-indigo-300">Global Analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { id: 'overview' as const, icon: '📊', label: 'Dashboard' },
            { id: 'piqueras' as const, icon: '📍', label: 'Red de Piqueras' },
            { id: 'health' as const, icon: '🛡️', label: 'Salud Operativa' },
          ].map((item) => (
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
              <p className="text-xs text-gray-400">Super Admin</p>
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

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Dashboard Global'}
                {activeTab === 'piqueras' && 'Red de Piqueras'}
                {activeTab === 'health' && 'Salud Operativa'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Lo que no se mide, no se mejora</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                ● Sistema operativo
              </span>
            </div>
          </div>
        </header>

        <main className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          {metrics && activeTab === 'overview' && <OverviewTab metrics={metrics} />}
          {metrics && activeTab === 'piqueras' && <PiquerasTab distribution={metrics.distribution} />}
          {metrics && activeTab === 'health' && <HealthTab metrics={metrics} />}
        </main>
      </div>
    </div>
  );
}

// ========================
// Tab: Overview
// ========================

function OverviewTab({ metrics }: { metrics: GlobalMetrics }) {
  const successRate = metrics.trips.total > 0
    ? Math.round((metrics.trips.completed / metrics.trips.total) * 100)
    : 0;
  const cancelRate = metrics.trips.total > 0
    ? Math.round((metrics.trips.cancelled / metrics.trips.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          icon="📍"
          iconBg="bg-indigo-50 text-indigo-600"
          title="Piqueras Afiliadas"
          value={metrics.piqueras.total}
          detail={`${metrics.piqueras.active} activas • ${metrics.piqueras.inactive} inactivas`}
          indicator={{ value: `${Math.round((metrics.piqueras.active / Math.max(metrics.piqueras.total, 1)) * 100)}%`, positive: true, label: 'tasa activa' }}
        />
        <KPICard
          icon="🚗"
          iconBg="bg-blue-50 text-blue-600"
          title="Flota Global"
          value={metrics.vehicles.total}
          detail="Taxis registrados"
          indicator={{ value: `${metrics.users.driver} conductores`, positive: true, label: 'registrados' }}
        />
        <KPICard
          icon="👥"
          iconBg="bg-green-50 text-green-600"
          title="Usuarios Totales"
          value={metrics.users.total}
          detail={`${metrics.users.passenger} pasajeros • ${metrics.users.driver} conductores`}
        />
        <KPICard
          icon="🎫"
          iconBg="bg-amber-50 text-amber-600"
          title="Viajes Totales"
          value={metrics.trips.total}
          detail={`${metrics.trips.active} activos ahora`}
          indicator={{ value: `${successRate}% éxito`, positive: successRate >= 70, label: '' }}
        />
      </div>

      {/* Trips breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Distribución de Viajes</h3>
          <div className="space-y-3">
            <TripBar label="Completados" count={metrics.trips.completed} total={metrics.trips.total} color="bg-green-500" />
            <TripBar label="Cancelados" count={metrics.trips.cancelled} total={metrics.trips.total} color="bg-red-400" />
            <TripBar label="En progreso" count={metrics.trips.active} total={metrics.trips.total} color="bg-blue-500" />
            <TripBar label="Pendientes" count={metrics.trips.pending} total={metrics.trips.total} color="bg-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Usuarios por Rol</h3>
          <div className="space-y-4">
            <UserRoleRow icon="🧑" label="Pasajeros" count={metrics.users.passenger} total={metrics.users.total} color="bg-green-500" />
            <UserRoleRow icon="🚗" label="Conductores" count={metrics.users.driver} total={metrics.users.total} color="bg-blue-500" />
            <UserRoleRow icon="📋" label="Administradores" count={metrics.users.admin} total={metrics.users.total} color="bg-purple-500" />
            <UserRoleRow icon="🏢" label="Super Admins" count={metrics.users.super_admin} total={metrics.users.total} color="bg-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// Tab: Piqueras Network
// ========================

function PiquerasTab({ distribution }: { distribution: PiqueraDistribution[] }) {
  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{distribution.length}</p>
          <p className="text-sm text-gray-500">Total Piqueras</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{distribution.filter((p) => p.isActive).length}</p>
          <p className="text-sm text-gray-500">Activas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{distribution.reduce((sum, p) => sum + p.activeDrivers, 0)}</p>
          <p className="text-sm text-gray-500">Conductores en Cola</p>
        </div>
      </div>

      {/* Piquera table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Análisis por Sector</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3 font-medium">Piquera</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-center">En Cola</th>
                <th className="px-6 py-3 font-medium text-center">Capacidad</th>
                <th className="px-6 py-3 font-medium text-center">Viajes</th>
                <th className="px-6 py-3 font-medium text-center">Completados</th>
                <th className="px-6 py-3 font-medium">Utilización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {distribution.map((p) => (
                <tr key={p.piqueraId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{p.piqueraName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      {p.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-gray-900">{p.activeDrivers}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {p.activeDrivers}/{p.maxCapacity}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-gray-900">{p.totalTrips}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-medium">
                    {p.completedTrips}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p.utilizationPercent >= 80 ? 'bg-red-500' :
                            p.utilizationPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(p.utilizationPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{p.utilizationPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========================
// Tab: Health
// ========================

function HealthTab({ metrics }: { metrics: GlobalMetrics }) {
  const activePiqueraRate = Math.round((metrics.piqueras.active / Math.max(metrics.piqueras.total, 1)) * 100);
  const tripSuccessRate = Math.round((metrics.trips.completed / Math.max(metrics.trips.total, 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Health indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <HealthCard
          title="Disponibilidad de Red"
          value={`${activePiqueraRate}%`}
          status={activePiqueraRate >= 80 ? 'healthy' : activePiqueraRate >= 50 ? 'warning' : 'critical'}
          description={`${metrics.piqueras.active} de ${metrics.piqueras.total} piqueras operativas`}
        />
        <HealthCard
          title="Tasa de Éxito"
          value={`${tripSuccessRate}%`}
          status={tripSuccessRate >= 80 ? 'healthy' : tripSuccessRate >= 60 ? 'warning' : 'critical'}
          description={`${metrics.trips.completed} viajes completados de ${metrics.trips.total}`}
        />
        <HealthCard
          title="Incidentes Registrados"
          value={String(metrics.incidents.total)}
          status={metrics.incidents.total <= 5 ? 'healthy' : metrics.incidents.total <= 15 ? 'warning' : 'critical'}
          description="Total acumulado del sistema"
        />
      </div>

      {/* Alert panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Panel de Alertas</h3>
        <div className="space-y-3">
          {metrics.piqueras.inactive > 0 && (
            <AlertRow
              type="warning"
              message={`${metrics.piqueras.inactive} piquera(s) inactiva(s) en el sistema`}
            />
          )}
          {metrics.trips.cancelled > 0 && (
            <AlertRow
              type="info"
              message={`${metrics.trips.cancelled} viaje(s) cancelado(s) — tasa: ${Math.round((metrics.trips.cancelled / Math.max(metrics.trips.total, 1)) * 100)}%`}
            />
          )}
          {metrics.incidents.total > 10 && (
            <AlertRow
              type="critical"
              message={`${metrics.incidents.total} incidentes acumulados — revisar reportes`}
            />
          )}
          {metrics.piqueras.inactive === 0 && metrics.trips.cancelled === 0 && metrics.incidents.total <= 10 && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
              <span className="text-lg">✅</span>
              <p className="text-sm text-green-700 font-medium">Sistema operando con normalidad — sin alertas activas</p>
            </div>
          )}
        </div>
      </div>

      {/* Capacity overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Resumen de Capacidad por Sector</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.distribution.map((p) => (
            <div key={p.piqueraId} className="p-4 border border-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm text-gray-900">{p.piqueraName}</p>
                <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      p.utilizationPercent >= 80 ? 'bg-red-500' :
                      p.utilizationPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(p.utilizationPercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{p.utilizationPercent}%</span>
              </div>
              <p className="text-xs text-gray-400">{p.activeDrivers}/{p.maxCapacity} conductores activos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========================
// Sub-components
// ========================

interface KPICardProps {
  icon: string;
  iconBg: string;
  title: string;
  value: number;
  detail: string;
  indicator?: { value: string; positive: boolean; label: string };
}

function KPICard({ icon, iconBg, title, value, detail, indicator }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${iconBg}`}>
          {icon}
        </div>
        {indicator && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            indicator.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {indicator.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

function TripBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
    </div>
  );
}

function UserRoleRow({ icon, label, count, total, color }: { icon: string; label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700 font-medium">{label}</span>
          <span className="text-gray-900 font-semibold">{count}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, value, status, description }: { title: string; value: string; status: 'healthy' | 'warning' | 'critical'; description: string }) {
  const styles = {
    healthy: 'border-green-100 bg-green-50',
    warning: 'border-yellow-100 bg-yellow-50',
    critical: 'border-red-100 bg-red-50',
  };
  const valueColors = {
    healthy: 'text-green-700',
    warning: 'text-yellow-700',
    critical: 'text-red-700',
  };
  const icons = { healthy: '✅', warning: '⚠️', critical: '🚨' };

  return (
    <div className={`rounded-xl border p-5 ${styles[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <span className="text-lg">{icons[status]}</span>
      </div>
      <p className={`text-3xl font-bold ${valueColors[status]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function AlertRow({ type, message }: { type: 'info' | 'warning' | 'critical'; message: string }) {
  const styles = {
    info: 'bg-blue-50 border-blue-100 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    critical: 'bg-red-50 border-red-100 text-red-700',
  };
  const icons = { info: 'ℹ️', warning: '⚠️', critical: '🚨' };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${styles[type]}`}>
      <span className="text-lg">{icons[type]}</span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
