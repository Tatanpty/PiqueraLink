import React from 'react';

type BadgeStatus = 'active' | 'available' | 'in_transit' | 'in_service' | 'in_progress' |
  'absent' | 'removed' | 'completed' | 'pending' | 'assigned' | 'accepted' | 'cancelled';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const styles: Record<string, { bg: string; dot: string }> = {
  active:      { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  available:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  completed:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  in_transit:  { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', dot: 'bg-blue-500' },
  in_service:  { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', dot: 'bg-indigo-500' },
  assigned:    { bg: 'bg-violet-50 text-violet-700 border-violet-200/60', dot: 'bg-violet-500' },
  accepted:    { bg: 'bg-sky-50 text-sky-700 border-sky-200/60', dot: 'bg-sky-500' },
  pending:     { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', dot: 'bg-amber-500' },
  cancelled:   { bg: 'bg-red-50 text-red-700 border-red-200/60', dot: 'bg-red-500' },
  absent:      { bg: 'bg-gray-50 text-gray-600 border-gray-200/60', dot: 'bg-gray-400' },
  removed:     { bg: 'bg-gray-50 text-gray-600 border-gray-200/60', dot: 'bg-gray-400' },
};

const labels: Record<string, string> = {
  active: 'Activo', available: 'Disponible', completed: 'Completado',
  in_transit: 'En tránsito', in_progress: 'En progreso', in_service: 'En servicio',
  assigned: 'Asignado', accepted: 'Aceptado', pending: 'Pendiente',
  cancelled: 'Cancelado', absent: 'Ausente', removed: 'Removido',
};

export function StatusBadge({ status, label, size = 'sm', pulse = false }: StatusBadgeProps) {
  const s = styles[status] || styles.absent;
  const displayLabel = label || labels[status] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${s.bg} ${
      size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${pulse ? 'animate-pulse-soft' : ''}`} />
      {displayLabel}
    </span>
  );
}
