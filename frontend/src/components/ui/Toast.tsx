'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/lib/store';
import { ToastType } from '@/lib/types';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  error: <AlertCircle className="h-4 w-4 text-red-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  info: <Info className="h-4 w-4 text-blue-600" />,
};

const bgStyles: Record<ToastType, string> = {
  success: 'border-emerald-200/60 bg-white',
  error: 'border-red-200/60 bg-white',
  warning: 'border-amber-200/60 bg-white',
  info: 'border-blue-200/60 bg-white',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto',
            'animate-slide-in-right',
            bgStyles[toast.type]
          )}
          role="alert"
        >
          <span className="shrink-0 mt-0.5">{iconMap[toast.type]}</span>
          <p className="flex-1 text-sm text-foreground">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-0.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}
