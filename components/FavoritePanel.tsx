'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLayoutContext, AdaptiveText } from '@/components/ResizablePanel';

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

function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconChevronUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

type FavoriteItem = {
  id: string;
  messageId: string;
  conversationId: string;
  messageContent: string;
  messageRole: string;
  messageCreatedAt: string;
  conversationTitle: string | null;
  createdAt: string;
};

type FavoritesByConversation = Map<
  string,
  {
    conversationTitle: string | null;
    favorites: FavoriteItem[];
    latestFavoriteAt: string;
  }
>;

interface FavoritePanelProps {
  visible: boolean;
  onClose: () => void;
  favorites: FavoriteItem[];
  onFavoriteClick: (conversationId: string, messageId: string) => Promise<void>;
  onUnfavorite: (favoriteId: string, e: React.MouseEvent) => Promise<void>;
}

export default function FavoritePanel({
  visible,
  onClose,
  favorites,
  onFavoriteClick,
  onUnfavorite,
}: FavoritePanelProps) {
  const { widthCategory, sidebarWidth } = useLayoutContext();

  const isNarrow = widthCategory === 'narrow';
  const isWide = widthCategory === 'wide';

  const itemPadding = useMemo(() => {
    if (isNarrow) return 'px-2 py-2';
    if (isWide) return 'px-4 py-3';
    return 'px-3 py-2.5';
  }, [isNarrow, isWide]);

  const titleLines = useMemo(() => {
    if (isNarrow) return 'line-clamp-1';
    if (isWide) return 'line-clamp-2';
    return 'line-clamp-2';
  }, [isNarrow, isWide]);

  const showTime = !isNarrow;

  const panelRef = useRef<HTMLDivElement>(null);
  const [firstGroupCollapsed, setFirstGroupCollapsed] = useState<boolean>(false);
  const [otherGroupsExpanded, setOtherGroupsExpanded] = useState<Set<string>>(new Set());

  const { favoritesByConversation, firstConversationId } = useMemo(() => {
    const grouped: FavoritesByConversation = new Map();

    favorites.forEach((fav) => {
      const existing = grouped.get(fav.conversationId);
      if (existing) {
        existing.favorites.push(fav);
        if (new Date(fav.createdAt) > new Date(existing.latestFavoriteAt)) {
          existing.latestFavoriteAt = fav.createdAt;
        }
      } else {
        grouped.set(fav.conversationId, {
          conversationTitle: fav.conversationTitle,
          favorites: [fav],
          latestFavoriteAt: fav.createdAt,
        });
      }
    });

    const groupedArray = Array.from(grouped.entries()).sort(
      (a, b) => new Date(b[1].latestFavoriteAt).getTime() - new Date(a[1].latestFavoriteAt).getTime()
    );

    const sortedGrouped: FavoritesByConversation = new Map();
    groupedArray.forEach(([id, data]) => {
      sortedGrouped.set(id, data);
    });

    return {
      favoritesByConversation: sortedGrouped,
      firstConversationId: groupedArray.length > 0 ? groupedArray[0][0] : null,
    };
  }, [favorites]);

  const toggleConversationGroup = useCallback((conversationId: string) => {
    if (conversationId === firstConversationId) {
      setFirstGroupCollapsed((prev) => !prev);
    } else {
      setOtherGroupsExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(conversationId)) {
          next.delete(conversationId);
        } else {
          next.add(conversationId);
        }
        return next;
      });
    }
  }, [firstConversationId]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconBookmark className="h-4 w-4 text-[#f59e0b]" filled />
            <span className="text-sm font-medium text-[#171717]">我的收藏</span>
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#fef3c7] text-[#92400e]">
              {favorites.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#404040] transition-colors"
            aria-label="关闭"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {favoritesByConversation.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconBookmark className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">暂无收藏</p>
              <p className="text-xs text-[#a3a3a3]">在对话中点击收藏按钮即可收藏消息</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from(favoritesByConversation.entries()).map(([conversationId, conversationData]) => {
                const isExpanded = conversationId === firstConversationId
                  ? !firstGroupCollapsed
                  : otherGroupsExpanded.has(conversationId);

                return (
                  <div key={conversationId} className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggleConversationGroup(conversationId)}
                      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isExpanded
                          ? 'bg-[#f5f5f5] text-[#171717]'
                          : 'bg-[#fafafa] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <IconChevronUp className="h-4 w-4 shrink-0" />
                        ) : (
                          <IconChevronDown className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">
                          {conversationData.conversationTitle?.trim() || '新对话'}
                        </span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${
                          isExpanded
                            ? 'bg-[#e5e5e5] text-[#525252]'
                            : 'bg-[#e5e5e5] text-[#737373]'
                        }`}>
                          {conversationData.favorites.length}
                        </span>
                      </div>
                      {showTime && (
                        <span className="shrink-0 text-[10px] text-[#a3a3a3]">
                          {formatRelativeTime(conversationData.latestFavoriteAt)}
                        </span>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="flex flex-col gap-0.5 ml-2">
                        {conversationData.favorites.map((fav) => (
                          <div
                            key={fav.id}
                            className="group flex items-stretch gap-0 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => onFavoriteClick(fav.conversationId, fav.messageId)}
                              className={`min-w-0 flex-1 flex flex-col items-start gap-0.5 rounded-l-lg px-3 py-2 text-left transition-colors hover:bg-[#fafafa] ${
                                isNarrow ? 'px-2 py-1.5' : ''
                              } ${isWide ? 'px-4 py-2.5' : ''}`}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-[10px] font-medium text-[#a3a3a3]">
                                  {fav.messageRole === 'user' ? '我' : 'AI'}
                                </span>
                                {showTime && (
                                  <span className="shrink-0 text-[10px] text-[#a3a3a3]">
                                    {formatRelativeTime(fav.createdAt)}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs text-[#737373] leading-relaxed ${
                                isWide ? 'line-clamp-3' : 'line-clamp-2'
                              }`}>
                                {fav.messageContent.length > 100
                                  ? fav.messageContent.slice(0, 100) + '...'
                                  : fav.messageContent}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => onUnfavorite(fav.id, e)}
                              className={`flex w-8 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-[#f5f5f5] hover:text-[#525252] rounded-r-lg group-hover:opacity-100 ${
                                isNarrow ? 'w-7' : ''
                              }`}
                              title="取消收藏"
                              aria-label="取消收藏"
                            >
                              <IconX className={`h-3.5 w-3.5 ${isNarrow ? 'h-3 w-3' : ''}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
