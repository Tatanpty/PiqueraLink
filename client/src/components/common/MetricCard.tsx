import React from 'react';

interface MetricCardProps {
  icon: string;
  label: string;
  value: number | string;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const bgMap = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-50 text-info-700',
};

export function MetricCard({ icon, label, value, subtitle, color = 'primary' }: MetricCardProps) {
  return (
    <div className="card group">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${bgMap[color]} transition-transform group-hover:scale-105`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
