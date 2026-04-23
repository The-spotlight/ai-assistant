'use client';

import type { Message } from 'ai';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import ChatSession from '@/components/ChatSession';
import FavoriteToastPanel from '@/components/FavoriteToastPanel';
import ResizablePanel, { useLayoutContext, AdaptiveText } from '@/components/ResizablePanel';
import { DEFAULT_OPENROUTER_MODEL_ID, FIXED_OPENROUTER_MODEL_LABEL } from '@/lib/openrouter-models';
import { CONVERSATION_STORAGE_KEY, getOrCreateDeviceId } from '@/lib/device';

type ConversationRow = {
  id: string;
  title: string | null;
  modelId: string | null;
  isPinned: boolean | null;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatPayload = {
  conversationId: string;
  messages: Message[];
};

type MatchedMessage = {
  id: string;
  role: string;
  content: string;
  matchStart: number;
  matchEnd: number;
  snippet: string;
};

type SearchResult = {
  conversationId: string;
  conversationTitle: string | null;
  updatedAt: string;
  matchedMessages: MatchedMessage[];
  titleMatch: boolean;
};

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

type TrashedConversationRow = {
  id: string;
  title: string | null;
  modelId: string | null;
  isPinned: boolean | null;
  pinnedAt: string | null;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
};

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

function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
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

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconPin(props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
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

function IconRotateCcw(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

interface SidebarContentProps {
  deviceId: string | null;
  loadingMain: boolean;
  newChat: () => Promise<void>;
  searchQuery: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearSearch: () => void;
  isSearching: boolean;
  showSearchResults: boolean;
  searchResults: SearchResult[];
  handleSearchResultClick: (conversationId: string, messageId?: string) => Promise<void>;
  convList: ConversationRow[];
  chatPayload: ChatPayload | null;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string, e: React.MouseEvent) => Promise<void>;
  togglePin: (id: string, e: React.MouseEvent) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  favorites: FavoriteItem[];
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
  handleFavoriteClick: (conversationId: string, messageId: string) => Promise<void>;
  handleUnfavorite: (favoriteId: string, e: React.MouseEvent) => Promise<void>;
  trashList: TrashedConversationRow[];
  showTrash: boolean;
  setShowTrash: (show: boolean) => void;
  restoreConversation: (id: string, e: React.MouseEvent) => Promise<void>;
  deleteFromTrash: (id: string, e: React.MouseEvent) => Promise<void>;
}

function SidebarContent({
  deviceId,
  loadingMain,
  newChat,
  searchQuery,
  handleSearchChange,
  clearSearch,
  isSearching,
  showSearchResults,
  searchResults,
  handleSearchResultClick,
  convList,
  chatPayload,
  selectConversation,
  deleteConversation,
  togglePin,
  renameConversation,
  favorites,
  showFavorites,
  setShowFavorites,
  handleFavoriteClick,
  handleUnfavorite,
  trashList,
  showTrash,
  setShowTrash,
  restoreConversation,
  deleteFromTrash,
}: SidebarContentProps) {
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
  const showWideInfo = isWide;

  const [pinnedCollapsed, setPinnedCollapsed] = useState<boolean>(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const editingInputRef = useRef<HTMLInputElement>(null);

  const { pinnedConversations, unpinnedConversations } = useMemo(() => {
    const pinned: ConversationRow[] = [];
    const unpinned: ConversationRow[] = [];

    convList.forEach((c) => {
      if (c.isPinned === true) {
        pinned.push(c);
      } else {
        unpinned.push(c);
      }
    });

    return { pinnedConversations: pinned, unpinnedConversations: unpinned };
  }, [convList]);

  type FavoritesByConversation = Map<
    string,
    {
      conversationTitle: string | null;
      favorites: FavoriteItem[];
      latestFavoriteAt: string;
    }
  >;

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

  const [firstGroupCollapsed, setFirstGroupCollapsed] = useState<boolean>(false);
  const [otherGroupsExpanded, setOtherGroupsExpanded] = useState<Set<string>>(new Set());

  const toggleConversationGroup = (conversationId: string) => {
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
  };

  const startEditing = useCallback((conversationId: string, currentTitle: string | null) => {
    setEditingConversationId(conversationId);
    setEditingTitle(currentTitle || '');
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editingConversationId) return;
    
    const newTitle = editingTitle.trim();
    if (newTitle) {
      await renameConversation(editingConversationId, newTitle);
    }
    
    setEditingConversationId(null);
    setEditingTitle('');
  }, [editingConversationId, editingTitle, renameConversation]);

  const cancelEditing = useCallback(() => {
    setEditingConversationId(null);
    setEditingTitle('');
  }, []);

  useEffect(() => {
    if (editingConversationId && editingInputRef.current) {
      editingInputRef.current.focus();
      editingInputRef.current.select();
    }
  }, [editingConversationId]);

  useEffect(() => {
    if (!editingConversationId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void saveEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (editingInputRef.current && !editingInputRef.current.contains(e.target as Node)) {
        void saveEditing();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingConversationId, saveEditing, cancelEditing]);

  return (
    <>
      <button
        type="button"
        onClick={() => newChat()}
        disabled={!deviceId || !!loadingMain}
        className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-40 ${
          isNarrow ? 'py-2 text-xs' : ''
        }`}
      >
        <IconPlus className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
        <AdaptiveText narrow="新建" wide="新建对话">
          新对话
        </AdaptiveText>
      </button>
      
      {/* 搜索框 */}
      <div className={`mb-3 relative ${isNarrow ? 'mb-2' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IconSearch className={`h-4 w-4 text-[#a3a3a3] ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={isNarrow ? '搜索...' : '搜索会话和消息...'}
          disabled={!deviceId}
          className={`w-full pl-10 pr-10 py-2 text-sm bg-[#fafafa] border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20 placeholder:text-[#a3a3a3] disabled:opacity-40 transition-all ${
            isNarrow ? 'py-1.5 text-xs' : ''
          }`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a3a3a3] hover:text-[#171717] transition-colors"
            aria-label="清除搜索"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#171717]/20 border-t-[#171717]" />
          </div>
        )}
      </div>

      {/* 我的收藏入口 */}
      {!showSearchResults && favorites.length > 0 && (
        <div className={`mb-3 ${isNarrow ? 'mb-2' : ''}`}>
          <button
            type="button"
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              showFavorites
                ? 'bg-[#fef3c7] text-[#92400e]'
                : 'bg-[#fafafa] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
            } ${isNarrow ? 'px-2 py-1.5 text-xs' : ''}`}
          >
            <div className="flex items-center gap-2">
              <IconBookmark className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} filled={showFavorites} />
              <AdaptiveText narrow="收藏" wide="我的收藏">
                我的收藏
              </AdaptiveText>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                showFavorites
                  ? 'bg-[#fcd34d] text-[#92400e]'
                  : 'bg-[#e5e5e5] text-[#737373]'
              }`}>
                {favorites.length}
              </span>
            </div>
            {showFavorites ? (
              <IconChevronUp className="h-4 w-4" />
            ) : (
              <IconChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* 收藏列表（按对话分组） */}
          {showFavorites && (
            <div className="mt-2 flex flex-col gap-1">
              {Array.from(favoritesByConversation.entries()).map(([conversationId, conversationData]) => {
                const isExpanded = conversationId === firstConversationId
                  ? !firstGroupCollapsed
                  : otherGroupsExpanded.has(conversationId);

                return (
                  <div key={conversationId} className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggleConversationGroup(conversationId)}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                        isExpanded
                          ? 'bg-[#f5f5f5] text-[#171717]'
                          : 'bg-[#fafafa] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#525252]'
                      } ${isNarrow ? 'px-1.5 py-1' : ''}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <IconChevronUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <IconChevronDown className="h-3 w-3 shrink-0" />
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
                              onClick={() => handleFavoriteClick(fav.conversationId, fav.messageId)}
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
                              onClick={(e) => handleUnfavorite(fav.id, e)}
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
      )}

      {/* 回收站入口 */}
      {!showSearchResults && trashList.length > 0 && (
        <div className={`mb-3 ${isNarrow ? 'mb-2' : ''}`}>
          <button
            type="button"
            onClick={() => setShowTrash(!showTrash)}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              showTrash
                ? 'bg-[#fef3c7] text-[#92400e]'
                : 'bg-[#fafafa] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
            } ${isNarrow ? 'px-2 py-1.5 text-xs' : ''}`}
          >
            <div className="flex items-center gap-2">
              <IconTrash className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
              <AdaptiveText narrow="回收站" wide="回收站">
                回收站
              </AdaptiveText>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                showTrash
                  ? 'bg-[#fcd34d] text-[#92400e]'
                  : 'bg-[#e5e5e5] text-[#737373]'
              }`}>
                {trashList.length}
              </span>
            </div>
            {showTrash ? (
              <IconChevronUp className="h-4 w-4" />
            ) : (
              <IconChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* 回收站列表 */}
          {showTrash && (
            <div className="mt-2 flex flex-col gap-0.5">
              <p className="px-1 text-[10px] text-[#a3a3a3]">
                删除后保留 7 天，可恢复或彻底删除
              </p>
              {trashList.map((c) => {
                return (
                  <div
                    key={c.id}
                    className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white transition-colors`}
                  >
                    <button
                      type="button"
                      className={`min-w-0 flex-1 ${itemPadding} text-left`}
                    >
                      <span className={`${titleLines} text-[13px] font-medium leading-snug text-[#737373] ${
                        isNarrow ? 'text-[12px]' : ''
                      } ${isWide ? 'text-sm' : ''}`}>
                        {c.title?.trim() || '新对话'}
                      </span>
                      {showTime && (
                        <span className={`mt-1 block text-[11px] text-[#a3a3a3] ${
                          isWide ? 'text-xs' : ''
                        }`}>
                          删除于 {formatRelativeTime(c.deletedAt)}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label="恢复会话"
                      onClick={(e) => restoreConversation(c.id, e)}
                      className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100 ${
                        isNarrow ? 'w-7' : ''
                      }`}
                      title="恢复会话"
                    >
                      <IconRotateCcw className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                    </button>
                    <button
                      type="button"
                      aria-label="彻底删除"
                      onClick={(e) => deleteFromTrash(c.id, e)}
                      className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 ${
                        isNarrow ? 'w-7' : ''
                      }`}
                      title="彻底删除（不可恢复）"
                    >
                      <IconTrash className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 搜索结果或历史会话列表 */}
      {showSearchResults ? (
        // 搜索结果展示
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-0.5">
          {isSearching ? (
            // 搜索中状态
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex gap-1.5 mb-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/70 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/50" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/30 [animation-delay:0.2s]" />
              </div>
              <p className="text-sm text-[#a3a3a3]">正在搜索...</p>
            </div>
          ) : searchResults.length === 0 ? (
            // 无搜索结果状态
            <div className="flex flex-col items-center justify-center py-8">
              <IconSearch className="h-8 w-8 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">未找到相关结果</p>
              <p className="text-xs text-[#a3a3a3]">尝试使用其他关键词</p>
            </div>
          ) : (
            // 搜索结果列表
            <div className="flex flex-col gap-0.5">
              {searchResults.map((result) => (
                <div key={result.conversationId} className="flex flex-col">
                  {/* 会话标题 */}
                  <button
                    type="button"
                    onClick={() => handleSearchResultClick(result.conversationId)}
                    className={`flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[#737373] hover:bg-[#fafafa] rounded-lg transition-colors text-left ${
                      isNarrow ? 'px-1.5 py-1' : ''
                    }`}
                  >
                    <span className="truncate">
                      {result.conversationTitle?.trim() || '新对话'}
                    </span>
                    {result.titleMatch && (
                      <span className="shrink-0 text-[10px] bg-[#fef3c7] text-[#92400e] px-1.5 py-0.5 rounded">
                        标题
                      </span>
                    )}
                    {showTime && (
                      <span className="shrink-0 text-[#a3a3a3]">
                        {formatRelativeTime(result.updatedAt)}
                      </span>
                    )}
                  </button>
                  
                  {/* 匹配的消息列表 */}
                  {!isNarrow && result.matchedMessages.map((msg) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => handleSearchResultClick(result.conversationId, msg.id)}
                      className={`flex flex-col items-start gap-0.5 px-3 py-2 ml-2 text-left hover:bg-[#fafafa] rounded-lg transition-colors border-l-2 border-[#e5e5e5] ${
                        isWide ? 'px-4 py-2.5' : ''
                      }`}
                    >
                      <span className="text-[10px] text-[#a3a3a3] font-medium">
                        {msg.role === 'user' ? '我' : 'AI'}
                      </span>
                      <p className={`text-xs text-[#525252] leading-relaxed ${
                        isWide ? 'line-clamp-4' : 'line-clamp-3'
                      }`}>
                        {msg.snippet}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // 历史会话列表
        <>
          {/* 置顶会话 */}
          {pinnedConversations.length > 0 && (
            <>
              <div className={`mb-2 flex items-center justify-between px-1 ${
                isNarrow ? 'mb-1' : ''
              }`}>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#a3a3a3]">
                  置顶会话
                </p>
                <button
                  type="button"
                  onClick={() => setPinnedCollapsed(!pinnedCollapsed)}
                  className="flex items-center justify-center rounded px-1 text-[#a3a3a3] transition hover:bg-[#f5f5f5] hover:text-[#171717]"
                  title={pinnedCollapsed ? '展开置顶会话' : '折叠置顶会话'}
                >
                  {pinnedCollapsed ? (
                    <IconChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <IconChevronUp className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {!pinnedCollapsed && (
                <div className="mb-3 flex flex-col gap-0.5">
                  {pinnedConversations.map((c) => {
                  const active = chatPayload?.conversationId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors ${
                        active
                          ? 'border-black/[0.08] bg-[#f4f4f5]'
                          : 'border-transparent hover:bg-[#fafafa]'
                      }`}
                    >
                      {/* 置顶视觉区分：左侧竖条 */}
                      <div className="w-1 shrink-0 bg-[#f59e0b] rounded-l-xl" />
                      <button
                        type="button"
                        onClick={() => {
                          if (editingConversationId !== c.id) {
                            void selectConversation(c.id);
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEditing(c.id, c.title);
                        }}
                        className={`min-w-0 flex-1 ${itemPadding} text-left`}
                        title={editingConversationId === c.id ? '编辑中...' : `双击重命名: ${c.title ?? '新对话'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <IconPin className={`h-3 w-3 shrink-0 text-[#f59e0b] ${isNarrow ? 'h-2.5 w-2.5' : ''}`} filled />
                          {editingConversationId === c.id ? (
                            <input
                              ref={editingInputRef}
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={`w-full min-w-0 bg-white border border-[#171717]/[0.12] rounded-lg px-2 py-1 text-[13px] font-medium leading-snug text-[#171717] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20 transition-all ${
                                isNarrow ? 'text-[12px] px-1.5 py-0.5' : ''
                              } ${isWide ? 'text-sm px-2.5 py-1.5' : ''}`}
                              placeholder="输入新标题..."
                            />
                          ) : (
                            <span className={`${titleLines} text-[13px] font-medium leading-snug text-[#171717] ${
                              isNarrow ? 'text-[12px]' : ''
                            } ${isWide ? 'text-sm' : ''}`}>
                              {c.title?.trim() || '新对话'}
                            </span>
                          )}
                        </div>
                        {showTime && editingConversationId !== c.id && (
                          <span className={`mt-1 block text-[11px] text-[#a3a3a3] ${
                            isWide ? 'text-xs' : ''
                          }`}>
                            {formatRelativeTime(c.updatedAt)}
                          </span>
                        )}
                        {showWideInfo && editingConversationId !== c.id && (
                          <span className="mt-0.5 block text-[10px] text-[#d4d4d4]">
                            ID: {c.id.slice(0, 8)}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="取消置顶"
                        onClick={(e) => togglePin(c.id, e)}
                        className={`flex w-9 shrink-0 items-center justify-center text-[#f59e0b] opacity-0 transition hover:bg-amber-50 group-hover:opacity-100 ${
                          isNarrow ? 'w-7' : ''
                        }`}
                        title="取消置顶"
                      >
                        <IconPin className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} filled />
                      </button>
                      <button
                        type="button"
                        aria-label="删除会话"
                        onClick={(e) => deleteConversation(c.id, e)}
                        className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 ${
                          isNarrow ? 'w-7' : ''
                        }`}
                      >
                        <IconTrash className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              )}
            </>
          )}

          {/* 普通会话 */}
          <p className={`mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-[#a3a3a3] ${
            isNarrow ? 'mb-1 text-[10px]' : ''
          }`}>
            <AdaptiveText narrow="会话" wide="历史会话列表">
              历史会话
            </AdaptiveText>
          </p>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5">
            {unpinnedConversations.length === 0 && pinnedConversations.length === 0 && !loadingMain && (
              <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-[#a3a3a3]">
                暂无会话记录
              </p>
            )}
            {unpinnedConversations.map((c) => {
              const active = chatPayload?.conversationId === c.id;
              return (
                <div
                  key={c.id}
                  className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors ${
                    active
                      ? 'border-black/[0.08] bg-[#f4f4f5]'
                      : 'border-transparent hover:bg-[#fafafa]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (editingConversationId !== c.id) {
                        void selectConversation(c.id);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startEditing(c.id, c.title);
                    }}
                    className={`min-w-0 flex-1 ${itemPadding} text-left`}
                    title={editingConversationId === c.id ? '编辑中...' : `双击重命名: ${c.title ?? '新对话'}`}
                  >
                    {editingConversationId === c.id ? (
                      <input
                        ref={editingInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full min-w-0 bg-white border border-[#171717]/[0.12] rounded-lg px-2 py-1 text-[13px] font-medium leading-snug text-[#171717] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20 transition-all ${
                          isNarrow ? 'text-[12px] px-1.5 py-0.5' : ''
                        } ${isWide ? 'text-sm px-2.5 py-1.5' : ''}`}
                        placeholder="输入新标题..."
                      />
                    ) : (
                      <>
                        <span className={`${titleLines} text-[13px] font-medium leading-snug text-[#171717] ${
                          isNarrow ? 'text-[12px]' : ''
                        } ${isWide ? 'text-sm' : ''}`}>
                          {c.title?.trim() || '新对话'}
                        </span>
                        {showTime && (
                          <span className={`mt-1 block text-[11px] text-[#a3a3a3] ${
                            isWide ? 'text-xs' : ''
                          }`}>
                            {formatRelativeTime(c.updatedAt)}
                          </span>
                        )}
                        {showWideInfo && (
                          <span className="mt-0.5 block text-[10px] text-[#d4d4d4]">
                            ID: {c.id.slice(0, 8)}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="置顶会话"
                    onClick={(e) => togglePin(c.id, e)}
                    className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-amber-50 hover:text-[#f59e0b] group-hover:opacity-100 ${
                      isNarrow ? 'w-7' : ''
                    }`}
                    title="置顶会话"
                  >
                    <IconPin className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                  </button>
                  <button
                    type="button"
                    aria-label="删除会话"
                    onClick={(e) => deleteConversation(c.id, e)}
                    className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 ${
                      isNarrow ? 'w-7' : ''
                    }`}
                  >
                    <IconTrash className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default function Home() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [chatPayload, setChatPayload] = useState<ChatPayload | null>(null);
  const [convList, setConvList] = useState<ConversationRow[]>([]);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  
  // 收藏相关状态
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);

  // 回收站相关状态
  const [trashList, setTrashList] = useState<TrashedConversationRow[]>([]);
  const [showTrash, setShowTrash] = useState<boolean>(false);

  // 收藏成功面板状态
  const [favoriteToastVisible, setFavoriteToastVisible] = useState<boolean>(false);
  const [favoriteToastData, setFavoriteToastData] = useState<{
    messageId: string;
    conversationTitle: string | null;
    messageContent: string;
    createdAt: string;
  } | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadConversations = useCallback(async (did: string) => {
    const r = await fetch('/api/conversations', { headers: { 'x-device-id': did } });
    if (!r.ok) return;
    const data = (await r.json()) as { conversations?: ConversationRow[] };
    setConvList(data.conversations ?? []);
  }, []);

  // 加载收藏列表
  const loadFavorites = useCallback(async (did: string) => {
    try {
      const r = await fetch('/api/favorites', { headers: { 'x-device-id': did } });
      if (!r.ok) return;
      const data = (await r.json()) as { favorites?: FavoriteItem[] };
      setFavorites(data.favorites ?? []);
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      setFavorites([]);
    }
  }, []);

  // 加载回收站列表
  const loadTrash = useCallback(async (did: string) => {
    try {
      const r = await fetch('/api/trash', { headers: { 'x-device-id': did } });
      if (!r.ok) return;
      const data = (await r.json()) as { conversations?: TrashedConversationRow[] };
      setTrashList(data.conversations ?? []);
    } catch (error) {
      console.error('加载回收站列表失败:', error);
      setTrashList([]);
    }
  }, []);

  // 恢复会话
  const restoreConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deviceId) return;

    const r = await fetch(`/api/trash/${id}/restore`, {
      method: 'PATCH',
      headers: { 'x-device-id': deviceId },
    });

    if (r.ok) {
      await loadTrash(deviceId);
      await loadConversations(deviceId);
    }
  }, [deviceId, loadTrash, loadConversations]);

  // 从回收站彻底删除
  const deleteFromTrash = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deviceId) return;

    const r = await fetch(`/api/trash/${id}`, {
      method: 'DELETE',
      headers: { 'x-device-id': deviceId },
    });

    if (r.ok) {
      await loadTrash(deviceId);
    }
  }, [deviceId, loadTrash]);

  // 关闭收藏成功面板
  const handleCloseFavoriteToast = useCallback(() => {
    setFavoriteToastVisible(false);
    setFavoriteToastData(null);
  }, []);

  // 从面板中取消收藏
  const handleUnfavoriteFromToast = useCallback(async () => {
    if (!favoriteToastData || !deviceId) return;

    const messageId = favoriteToastData.messageId;
    const favoriteItem = favorites.find(fav => fav.messageId === messageId);

    if (favoriteItem) {
      const r = await fetch(`/api/favorites/${favoriteItem.id}`, {
        method: 'DELETE',
        headers: { 'x-device-id': deviceId },
      });

      if (r.ok) {
        await loadFavorites(deviceId);
      }
    }
  }, [favoriteToastData, deviceId, favorites, loadFavorites]);

  // 收藏/取消收藏消息
  const handleToggleFavorite = useCallback(async (messageId: string, isFavorite: boolean) => {
    if (!deviceId || !chatPayload) return;

    try {
      if (isFavorite) {
        // 收藏消息
        const r = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-id': deviceId,
          },
          body: JSON.stringify({
            messageId,
            conversationId: chatPayload.conversationId,
          }),
        });

        if (r.ok) {
          const data = (await r.json()) as {
            id: string;
            messageId: string;
            conversationId: string;
            createdAt: string;
            isNew: boolean;
          };

          await loadFavorites(deviceId);

          // 只有新收藏的消息才显示面板
          if (data.isNew) {
            // 获取对话标题
            const conversation = convList.find(c => c.id === chatPayload.conversationId);
            const conversationTitle = conversation?.title ?? null;

            // 获取消息内容
            const message = chatPayload.messages.find(m => m.id === messageId);
            const messageContent = message?.content ?? '';

            setFavoriteToastData({
              messageId: data.messageId,
              conversationTitle,
              messageContent,
              createdAt: data.createdAt,
            });
            setFavoriteToastVisible(true);
          }
        }
      } else {
        // 取消收藏：找到对应的收藏记录并删除
        const favoriteItem = favorites.find(fav => fav.messageId === messageId);
        if (favoriteItem) {
          const r = await fetch(`/api/favorites/${favoriteItem.id}`, {
            method: 'DELETE',
            headers: { 'x-device-id': deviceId },
          });

          if (r.ok) {
            await loadFavorites(deviceId);
          }
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  }, [deviceId, chatPayload, favorites, loadFavorites, convList]);

  // 处理收藏点击
  const handleFavoriteClick = useCallback(async (conversationId: string, messageId: string) => {
    // 关闭收藏列表
    setShowFavorites(false);
    
    // 设置要高亮的消息ID
    setHighlightMessageId(messageId);
    
    // 跳转到对应会话
    await selectConversation(conversationId);
  }, []);

  // 处理取消收藏（从收藏列表中）
  const handleUnfavorite = useCallback(async (favoriteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deviceId) return;

    try {
      const r = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: { 'x-device-id': deviceId },
      });

      if (r.ok) {
        await loadFavorites(deviceId);
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  }, [deviceId, loadFavorites]);

  // 搜索函数
  const performSearch = useCallback(async (query: string) => {
    if (!deviceId || !query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { 'x-device-id': deviceId },
      });
      
      if (r.ok) {
        const data = (await r.json()) as { results?: SearchResult[] };
        setSearchResults(data.results ?? []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [deviceId]);

  // 处理搜索输入变化（防抖）
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setHighlightMessageId(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // 处理搜索结果点击
  const handleSearchResultClick = useCallback(async (conversationId: string, messageId?: string) => {
    // 清除搜索状态
    clearSearch();
    
    // 设置要高亮的消息ID
    if (messageId) {
      setHighlightMessageId(messageId);
    }
    
    // 跳转到对应会话
    await selectConversation(conversationId);
  }, [clearSearch]);

  // 清除高亮状态
  const clearHighlight = useCallback(() => {
    setHighlightMessageId(null);
  }, []);

  useEffect(() => {
    const did = getOrCreateDeviceId();
    if (!did) {
      setBootstrapError('无法读取本地设备标识');
      return;
    }
    setDeviceId(did);

    let cancelled = false;
    (async () => {
      try {
        let cid = localStorage.getItem(CONVERSATION_STORAGE_KEY);
        if (cid) {
          const check = await fetch(`/api/conversations/${cid}/messages`, {
            headers: { 'x-device-id': did },
          });
          if (check.ok) {
            const data = (await check.json()) as { messages?: Message[] };
            if (cancelled) return;
            setChatPayload({
              conversationId: cid,
              messages: data.messages ?? [],
            });
            await loadConversations(did);
            await loadFavorites(did);
            await loadTrash(did);
            return;
          }
        }

        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-device-id': did },
          body: JSON.stringify({ deviceId: did }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? '创建会话失败');
        }
        const { id } = (await res.json()) as { id: string };
        if (cancelled) return;
        localStorage.setItem(CONVERSATION_STORAGE_KEY, id);
        setChatPayload({ conversationId: id, messages: [] });
        await loadConversations(did);
        await loadFavorites(did);
        await loadTrash(did);
      } catch (e) {
        if (!cancelled) {
          setBootstrapError(e instanceof Error ? e.message : '初始化失败');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  async function selectConversation(id: string) {
    if (!deviceId) return;
    setChatPayload(null);
    try {
      const r = await fetch(`/api/conversations/${id}/messages`, {
        headers: { 'x-device-id': deviceId },
      });
      if (!r.ok) return;
      const data = (await r.json()) as { messages?: Message[] };
      localStorage.setItem(CONVERSATION_STORAGE_KEY, id);
      setChatPayload({
        conversationId: id,
        messages: data.messages ?? [],
      });
    } catch {
      /* ignore */
    }
  }

  async function newChat() {
    if (!deviceId) return;
    setChatPayload(null);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({ deviceId }),
      });
      if (!res.ok) return;
      const { id } = (await res.json()) as { id: string };
      localStorage.setItem(CONVERSATION_STORAGE_KEY, id);
      setChatPayload({ conversationId: id, messages: [] });
      await loadConversations(deviceId);
      await loadFavorites(deviceId);
      await loadTrash(deviceId);
    } catch {
      /* ignore */
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!deviceId) return;
    const r = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: { 'x-device-id': deviceId },
    });
    if (!r.ok) return;

    const listRes = await fetch('/api/conversations', {
      headers: { 'x-device-id': deviceId },
    });
    const data = (await listRes.json()) as { conversations?: ConversationRow[] };
    const list = data.conversations ?? [];
    setConvList(list);
    
    await loadTrash(deviceId);
    await loadFavorites(deviceId);

    if (chatPayload?.conversationId !== id) return;

    if (list.length > 0) {
      await selectConversation(list[0].id);
    } else {
      setChatPayload(null);
      const cre = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({ deviceId }),
      });
      if (!cre.ok) return;
      const { id: newId } = (await cre.json()) as { id: string };
      localStorage.setItem(CONVERSATION_STORAGE_KEY, newId);
      setChatPayload({ conversationId: newId, messages: [] });
      await loadConversations(deviceId);
      await loadFavorites(deviceId);
    }
  }

  async function togglePin(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!deviceId) return;

    const conversation = convList.find((c) => c.id === id);
    if (!conversation) return;

    const newIsPinned = conversation.isPinned !== true;

    const r = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({ isPinned: newIsPinned }),
    });

    if (!r.ok) return;

    const listRes = await fetch('/api/conversations', {
      headers: { 'x-device-id': deviceId },
    });
    const data = (await listRes.json()) as { conversations?: ConversationRow[] };
    const list = data.conversations ?? [];
    setConvList(list);
  }

  async function renameConversation(id: string, newTitle: string) {
    if (!deviceId) return;

    const r = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({ title: newTitle }),
    });

    if (!r.ok) return;

    const listRes = await fetch('/api/conversations', {
      headers: { 'x-device-id': deviceId },
    });
    const data = (await listRes.json()) as { conversations?: ConversationRow[] };
    const list = data.conversations ?? [];
    setConvList(list);
  }

  const loadingMain = !!(deviceId && !chatPayload && !bootstrapError);

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      <header className="z-30 shrink-0 border-b border-[rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[11px] font-medium text-white">
              AI
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#171717] sm:text-base" style={{ letterSpacing: '-0.32px' }}>
                智能助手
              </h1>
              <p className="hidden text-[11px] text-[#666666] sm:block">对话已同步到此浏览器</p>
            </div>
          </div>
          <p className="shrink-0 text-right text-[11px] text-[#666666] sm:text-xs" title="当前固定模型">
            {FIXED_OPENROUTER_MODEL_LABEL}
          </p>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col gap-0 overflow-hidden px-3 pb-4 pt-4 sm:flex-row sm:px-5 sm:pb-6 sm:pt-5">
        <ResizablePanel defaultWidth={260} minWidth={200} maxWidth={500}>
          <SidebarContent
            deviceId={deviceId}
            loadingMain={loadingMain}
            newChat={newChat}
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            clearSearch={clearSearch}
            isSearching={isSearching}
            showSearchResults={showSearchResults}
            searchResults={searchResults}
            handleSearchResultClick={handleSearchResultClick}
            convList={convList}
            chatPayload={chatPayload}
            selectConversation={selectConversation}
            deleteConversation={deleteConversation}
            togglePin={togglePin}
            renameConversation={renameConversation}
            favorites={favorites}
            showFavorites={showFavorites}
            setShowFavorites={setShowFavorites}
            handleFavoriteClick={handleFavoriteClick}
            handleUnfavorite={handleUnfavorite}
            trashList={trashList}
            showTrash={showTrash}
            setShowTrash={setShowTrash}
            restoreConversation={restoreConversation}
            deleteFromTrash={deleteFromTrash}
          />
        </ResizablePanel>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* 移动端：会话 + 新对话 */}
          {deviceId && convList.length > 0 && (
            <div className="mb-3 flex shrink-0 gap-2 sm:hidden">
              <label htmlFor="mobile-conv" className="sr-only">
                切换会话
              </label>
              <div className="relative min-w-0 flex-1">
                <select
                  id="mobile-conv"
                  value={chatPayload?.conversationId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) void selectConversation(v);
                  }}
                  disabled={!!loadingMain}
                  className="w-full appearance-none rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-10 text-[13px] font-medium text-[#171717] shadow-sm"
                >
                  {convList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title?.trim() || '新对话'}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]" />
              </div>
              <button
                type="button"
                onClick={() => newChat()}
                disabled={!deviceId || !!loadingMain}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#171717] shadow-sm transition hover:bg-[#fafafa] disabled:opacity-40"
                aria-label="新对话"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
          )}

          {bootstrapError && (
            <div
              className="mb-4 flex shrink-0 items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                !
              </span>
              <span>{bootstrapError}</span>
            </div>
          )}

          {loadingMain && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-black/[0.06] bg-white px-6 py-16 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/70 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/50" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/30 [animation-delay:0.2s]" />
              </div>
              <p className="text-sm font-medium text-[#737373]">正在加载会话</p>
              <div className="h-2 w-40 max-w-full animate-pulse rounded-full bg-[#ebebeb]" />
            </div>
          )}

          {deviceId && chatPayload && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatSession
                key={chatPayload.conversationId}
                deviceId={deviceId}
                conversationId={chatPayload.conversationId}
                modelId={DEFAULT_OPENROUTER_MODEL_ID}
                initialMessages={chatPayload.messages}
                highlightMessageId={highlightMessageId}
                onHighlightCleared={clearHighlight}
                favoriteMessageIds={new Set(favorites.map(fav => fav.messageId))}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          )}
        </main>
      </div>

      {/* 收藏成功面板 */}
      {favoriteToastVisible && favoriteToastData && (
        <FavoriteToastPanel
          visible={favoriteToastVisible}
          messageId={favoriteToastData.messageId}
          conversationTitle={favoriteToastData.conversationTitle}
          messageContent={favoriteToastData.messageContent}
          createdAt={favoriteToastData.createdAt}
          onClose={handleCloseFavoriteToast}
          onUnfavorite={handleUnfavoriteFromToast}
          autoCloseDuration={3000}
        />
      )}
    </div>
  );
}
