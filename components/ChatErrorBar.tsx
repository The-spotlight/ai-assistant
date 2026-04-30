'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatErrorBarProps {
  visible: boolean;
  message: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onClose: () => void;
}

export default function ChatErrorBar({
  visible,
  message,
  retryCount,
  maxRetries,
  onRetry,
  onClose,
}: ChatErrorBarProps) {
  if (!visible) return null;

  const canRetry = retryCount < maxRetries;

  return (
    <div className="sticky bottom-0 z-40 w-full bg-red-50 border-t border-red-200 shadow-lg">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-4 w-4 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-800 truncate">
              {message}
            </p>
            {!canRetry && (
              <p className="text-xs text-red-600 mt-0.5">
                已达到最大重试次数，请稍后再试
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={canRetry ? 'destructive' : 'outline'}
            size="sm"
            onClick={onRetry}
            disabled={!canRetry}
            className="text-xs h-7"
          >
            重试
            {canRetry && (
              <span className="ml-1 text-xs opacity-80">
                ({retryCount + 1}/{maxRetries})
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
