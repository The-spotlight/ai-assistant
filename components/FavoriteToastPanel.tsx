'use client';

import { useEffect, useRef } from 'react';

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconBookmark(props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface FavoriteToastPanelProps {
  visible: boolean;
  messageId: string;
  conversationTitle: string | null;
  messageContent: string;
  createdAt: string;
  onClose: () => void;
  onUnfavorite: () => void;
  autoCloseDuration?: number;
}

export default function FavoriteToastPanel({
  visible,
  messageId,
  conversationTitle,
  messageContent,
  createdAt,
  onClose,
  onUnfavorite,
  autoCloseDuration = 3000,
}: FavoriteToastPanelProps) {
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && autoCloseDuration > 0) {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [visible, autoCloseDuration, onClose]);

  const handleMouseEnter = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (autoCloseDuration > 0) {
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
    }
  };

  const handleUnfavorite = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    onUnfavorite();
    onClose();
  };

  const previewContent = messageContent.length > 100
    ? messageContent.slice(0, 100) + '...'
    : messageContent;

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className="w-80 rounded-xl border border-black/[0.08] bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <style>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        <div className="bg-[#fef3c7] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconBookmark className="h-4 w-4 text-[#92400e]" filled />
            <span className="text-sm font-medium text-[#92400e]">已收藏</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#92400e] hover:text-[#78350f] transition-colors"
            aria-label="关闭"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] text-[#a3a3a3] font-medium">收藏时间</p>
            <p className="text-sm text-[#525252]">{formatTime(createdAt)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-[#a3a3a3] font-medium">所属对话</p>
            <p className="text-sm text-[#525252] truncate" title={conversationTitle ?? '新对话'}>
              {conversationTitle?.trim() || '新对话'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-[#a3a3a3] font-medium">消息预览</p>
            <p 
              className="text-sm text-[#737373] leading-relaxed whitespace-pre-wrap"
              title={messageContent}
            >
              {previewContent}
            </p>
          </div>
        </div>

        <div className="border-t border-black/[0.06] px-4 py-2.5 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleUnfavorite}
            className="px-3 py-1.5 text-xs text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors"
          >
            取消收藏
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#737373] hover:bg-[#f5f5f5] rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
