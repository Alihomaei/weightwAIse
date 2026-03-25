'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { isAuthenticated, getStoredUser, clearTokens } from '@/lib/auth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Database,
  BookOpen,
  Users,
  Settings,
  Stethoscope,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/knowledge-base', label: 'Knowledge Base', icon: Database },
  { href: '/admin/pubmed', label: 'PubMed', icon: BookOpen },
  { href: '/admin/patients', label: 'Patients', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    const storedUser = getStoredUser();
    if (storedUser) {
      if (storedUser.role !== 'admin') {
        router.push('/chat');
        return;
      }
      setUser(storedUser);
    } else {
      router.push('/');
      return;
    }
    setLoading(false);
  }, [router, setUser, setLoading]);

  const handleLogout = () => {
    clearTokens();
    useAuthStore.getState().logout();
    router.push('/');
  };

  if (isLoading || !user) {
    return <FullPageSpinner message="Loading admin panel..." />;
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-medical-bg">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-medical-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-medical-border">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-medical-text leading-tight">
                weight<span className="text-teal-600">w</span>AIse
              </h1>
              <p className="text-[10px] text-medical-muted">Admin Panel</p>
            </div>
            {/* Close button on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1 rounded lg:hidden hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-medical-muted" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-medical-muted hover:bg-gray-50 hover:text-medical-text'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      active ? 'text-primary-600' : 'text-gray-400'
                    )}
                  />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User / Logout */}
          <div className="border-t border-medical-border px-3 py-4">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary-700">
                  {user.full_name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-medical-text truncate">
                  {user.full_name || user.username}
                </p>
                <p className="text-[10px] text-medical-muted">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-medical-muted hover:bg-red-50 hover:text-red-600 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-medical-border px-6 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5 text-medical-text" />
          </button>
          <span className="text-sm font-medium text-medical-text">
            Admin Panel
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
