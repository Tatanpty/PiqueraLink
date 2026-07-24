import React from 'react';
import { useAuthContext } from '../../context/AuthContext';

interface NavItem {
  label: string;
  icon: string;
  id: string;
}

interface SidebarProps {
  items: NavItem[];
  activeItem: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ items, activeItem, onNavigate }: SidebarProps) {
  const { user, logout } = useAuthContext();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar-bg text-white min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
          <span className="text-lg">🚕</span>
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-white">PiqueraLink</span>
          <p className="text-[10px] text-sidebar-text font-medium uppercase tracking-widest">Mobility Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeItem === item.id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'text-sidebar-text hover:text-sidebar-textActive hover:bg-sidebar-hover'
            }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User profile */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-text truncate">{user?.role === 'super_admin' ? 'Super Admin' : user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-text hover:text-white hover:bg-sidebar-hover rounded-lg transition-colors"
        >
          <span>→</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

/* Mobile header for small screens */
export function MobileHeader({ title }: { title: string }) {
  const { user, logout } = useAuthContext();

  return (
    <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <span className="text-xl">🚕</span>
        <span className="font-bold text-gray-900">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
          Salir
        </button>
      </div>
    </header>
  );
}
