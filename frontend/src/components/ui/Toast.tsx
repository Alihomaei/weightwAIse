'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/lib/store';
import { ToastType } from '@/lib/types';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const bgStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
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
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto',
            'animate-slide-in-right',
            bgStyles[toast.type]
          )}
          role="alert"
        >
          <span className="shrink-0 mt-0.5">{iconMap[toast.type]}</span>
          <p className="flex-1 text-sm text-medical-text">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4 text-medical-muted" />
          </button>
        </div>
      ))}
    </div>
  );
}
