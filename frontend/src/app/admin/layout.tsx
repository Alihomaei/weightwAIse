'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { isAuthenticated, getStoredUser, clearTokens } from '@/lib/auth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Database,
  BookOpen,
  Users,
  Settings,
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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-card border-r transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4">
            <Image
              src="/logo.png"
              alt="WeightwAIse"
              width={110}
              height={48}
              className="h-8 w-auto"
              priority
            />
            {/* Close button on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg lg:hidden hover:bg-muted transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-0.5">
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
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active ? 'text-primary-800' : 'text-muted-foreground'
                    )}
                  />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <Separator />

          {/* User / Logout */}
          <div className="px-3 py-4">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">
                  {user.full_name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name || user.username}
                </p>
                <p className="text-[11px] text-muted-foreground">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors w-full"
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
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar (mobile only) */}
        <header className="bg-card border-b px-5 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <Image
            src="/logo.png"
            alt="WeightwAIse"
            width={90}
            height={40}
            className="h-6 w-auto"
          />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
