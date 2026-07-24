import React, { ReactNode } from 'react';
import { Sidebar, MobileHeader } from './Sidebar';

interface NavItem {
  label: string;
  icon: string;
  id: string;
}

interface AppLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  activeItem: string;
  onNavigate: (id: string) => void;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, navItems, activeItem, onNavigate, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex bg-surface-50">
      <Sidebar items={navItems} activeItem={activeItem} onNavigate={onNavigate} />

      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader title="PiqueraLink" />

        {/* Page header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 lg:px-8 py-5 sticky top-0 lg:top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
