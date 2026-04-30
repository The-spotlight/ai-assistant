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
    <div className="sticky bottom-0 z-40 w-full">
      {/* 渐变过渡层 - 实现与输入框的平滑视觉衔接 */}
      <div 
        className="h-3 w-full"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(254, 242, 242, 0.5))',
        }}
      />
      
      {/* 错误提示条主体 */}
      <div 
        className="w-full"
        style={{
          background: 'linear-gradient(to bottom, rgba(254, 242, 242, 0.95), rgba(254, 242, 242, 1))',
          borderTop: '1px solid rgba(248, 113, 113, 0.3)',
          boxShadow: '0 -4px 20px -8px rgba(239, 68, 68, 0.15), 0 1px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* 错误图标 */}
            <div 
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.8), rgba(239, 68, 68, 0.9))',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
              }}
            >
              <svg
                className="h-4 w-4 text-white"
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
            
            {/* 错误消息 */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800 truncate">
                {message}
              </p>
              {!canRetry && (
                <p className="text-xs text-red-600 mt-0.5 opacity-90">
                  已达到最大重试次数，请稍后再试
                </p>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 重试按钮 */}
            <Button
              variant={canRetry ? 'destructive' : 'outline'}
              size="sm"
              onClick={onRetry}
              disabled={!canRetry}
              className="text-xs h-7"
              style={{
                opacity: canRetry ? 1 : 0.6,
              }}
            >
              重试
              {canRetry && (
                <span className="ml-1 text-xs opacity-80">
                  ({retryCount + 1}/{maxRetries})
                </span>
              )}
            </Button>
            
            {/* 关闭按钮 - 常态显示 */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200"
              style={{
                color: '#dc2626',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.15)';
                e.currentTarget.style.color = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#dc2626';
              }}
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 底部渐变 - 与下方输入框衔接 */}
      <div 
        className="h-1 w-full"
        style={{
          background: 'linear-gradient(to bottom, rgba(254, 242, 242, 0.8), rgba(255, 255, 255, 0))',
        }}
      />
    </div>
  );
}
