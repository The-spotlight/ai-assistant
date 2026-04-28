'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: Check,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]',
  error: 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]',
  info: 'bg-[#f0f9ff] border-[#bae6fd] text-[#0284c7]',
  warning: 'bg-[#fef3c7] border-[#fde68a] text-[#d97706]',
};

const iconStyles = {
  success: 'text-[#22c55e]',
  error: 'text-[#dc2626]',
  info: 'text-[#3b82f6]',
  warning: 'text-[#d97706]',
};

export function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  const Icon = icons[type];

  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 border rounded-lg px-3 py-2.5 transition-all animate-slide-in',
        styles[type]
      )}
      style={{
        animation: 'slideIn 0.2s ease-out',
      }}
    >
      <Icon className={cn('h-4 w-4 shrink-0', iconStyles[type])} />
      <span className="text-xs font-medium">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto p-0.5 rounded hover:bg-black/[0.05] transition-colors"
        aria-label="关闭"
      >
        <X className="h-3 w-3 opacity-60" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}