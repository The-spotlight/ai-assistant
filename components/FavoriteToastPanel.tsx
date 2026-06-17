'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Bookmark } from 'lucide-react';

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
        className="w-80 rounded-xl border border-black/[0.06] bg-gradient-to-br from-white via-[#fafafa] to-[#f5f5f5] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
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

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[#404040] fill-[#404040]" />
            <span className="text-sm font-medium text-[#171717]">已收藏</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-3 bg-white/60">
          <div className="space-y-1">
            <p className="text-[10px] text-[#a3a3a3] font-medium uppercase tracking-wider">收藏时间</p>
            <p className="text-sm text-[#525252]">{formatTime(createdAt)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-[#a3a3a3] font-medium uppercase tracking-wider">所属对话</p>
            <p className="text-sm text-[#525252] truncate" title={conversationTitle ?? '新对话'}>
              {conversationTitle?.trim() || '新对话'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-[#a3a3a3] font-medium uppercase tracking-wider">消息预览</p>
            <p 
              className="text-sm text-[#737373] leading-relaxed whitespace-pre-wrap"
              title={messageContent}
            >
              {previewContent}
            </p>
          </div>
        </div>

        <div className="border-t border-black/[0.06] px-4 py-2.5 flex justify-end gap-2 bg-[#fafafa]/80">
          <Button variant="ghost" size="sm" onClick={handleUnfavorite} className="text-xs">
            取消收藏
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
