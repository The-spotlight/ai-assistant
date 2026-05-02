'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Check, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ArtboardPanelProps {
  messageId: string;
  messageRole: string;
  messageContent: string;
  conversationTitle: string | null;
  deviceId: string;
  conversationId: string;
  onClose: () => void;
  onApply: (newContent: string) => void;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

function IconSplit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M9 3v18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

function IconMaximize(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export default function ArtboardPanel({
  messageId,
  messageRole,
  messageContent,
  conversationTitle,
  onClose,
  onApply,
  minWidth = 300,
  maxWidth = 800,
  defaultWidth = 500,
}: ArtboardPanelProps) {
  const [content, setContent] = useState(messageContent);
  const [isEditing, setIsEditing] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasChanges = content !== messageContent;

  useEffect(() => {
    setContent(messageContent);
  }, [messageContent]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleApply = useCallback(async () => {
    if (!hasChanges || isApplying) return;
    setIsApplying(true);
    try {
      onApply(content);
    } finally {
      setIsApplying(false);
    }
  }, [content, hasChanges, isApplying, onApply]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasChanges) {
          const confirmed = window.confirm('是否放弃未保存的更改？');
          if (confirmed) {
            onClose();
          }
        } else {
          onClose();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void handleApply();
      }
    },
    [hasChanges, handleApply, onClose]
  );

  return (
    <div
      className="flex h-full min-h-0 flex-col border-l border-black/[0.08] bg-white shadow-[-2px_0_8px_rgba(0,0,0,0.04)]"
      onKeyDown={handleKeyDown}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <IconSplit className="h-4 w-4 text-[#737373]" />
            <span className="text-xs font-medium text-[#737373]">画板</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[#171717]">
              {messageRole === 'user' ? '我的消息' : 'AI 回复'}
            </span>
            <span className="text-xs text-[#a3a3a3]">·</span>
            <span className="truncate text-xs text-[#a3a3a3]">
              {conversationTitle?.trim() || '新对话'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? '切换到预览模式' : '切换到编辑模式'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#525252] hover:bg-[#fafafa] hover:text-[#171717] transition-colors"
          >
            {isEditing ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="关闭画板"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#525252] hover:bg-[#fafafa] hover:text-[#171717] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEditing ? (
          <div className="h-full p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full w-full resize-none rounded-lg border border-black/[0.08] bg-[#fafafa] p-4 text-[14px] leading-relaxed text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20"
              placeholder="在此编辑消息内容..."
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="p-4">
            <div className="rounded-lg border border-black/[0.06] bg-white p-4 shadow-sm">
              {messageRole === 'user' ? (
                <span className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#171717]">
                  {content}
                </span>
              ) : (
                <MarkdownRenderer content={content} />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-black/[0.06] bg-white/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            {hasChanges ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" />
                <span className="text-xs text-[#737373]">
                  有未保存的更改
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                <span className="text-xs text-[#737373]">内容已同步</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContent(messageContent)}
              disabled={!hasChanges}
              className="text-xs"
            >
              重置
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!hasChanges || isApplying}
              className="text-xs"
            >
              {isApplying ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  应用中...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  应用到对话
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
