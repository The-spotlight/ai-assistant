'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useLayoutContext, AdaptiveText } from '@/components/ResizablePanel';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  getRecentConversations,
  getFrequentConversations,
  CONVERSATION_HISTORY_CHANGED_EVENT,
  type ConversationHistoryItem,
} from '@/lib/conversation-history';
import { DRAFT_CHANGED_EVENT } from '@/lib/draft-history';
import type { ConversationRow } from '@/components/ConversationListItem';

const DRAFT_KEY_PREFIX = 'chat_draft_';

function IconClock(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconStar(props: React.SVGProps<SVGSVGElement>) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconEdit(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconChevronUp(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

type TabType = 'recent' | 'frequent' | 'drafts';

interface QuickAccessPanelProps {
  convList: ConversationRow[];
  selectedConversationId: string | undefined;
  selectConversation: (id: string) => Promise<void>;
  openInNewTab: (id: string) => void;
}

interface DraftConversation {
  conversationId: string;
  draftContent: string;
}

function getDraftConversations(): DraftConversation[] {
  try {
    const drafts: DraftConversation[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        const conversationId = key.slice(DRAFT_KEY_PREFIX.length);
        const content = localStorage.getItem(key) || '';
        if (content.trim()) {
          drafts.push({
            conversationId,
            draftContent: content,
          });
        }
      }
    }
    return drafts;
  } catch (e) {
    console.error('Failed to get draft conversations:', e);
    return [];
  }
}

const MAX_ITEMS_PER_TAB = 5;

export default function QuickAccessPanel({
  convList,
  selectedConversationId,
  selectConversation,
  openInNewTab,
}: QuickAccessPanelProps) {
  const { widthCategory } = useLayoutContext();

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

  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [isExpanded, setIsExpanded] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const handleHistoryChanged = () => {
      triggerRefresh();
    };

    const handleDraftChanged = () => {
      triggerRefresh();
    };

    const handleStorageChanged = (e: StorageEvent) => {
      if (
        e.key?.startsWith(DRAFT_KEY_PREFIX) ||
        e.key === 'ai_assistant_conversation_history'
      ) {
        triggerRefresh();
      }
    };

    window.addEventListener(CONVERSATION_HISTORY_CHANGED_EVENT, handleHistoryChanged);
    window.addEventListener(DRAFT_CHANGED_EVENT, handleDraftChanged);
    window.addEventListener('storage', handleStorageChanged);

    return () => {
      window.removeEventListener(CONVERSATION_HISTORY_CHANGED_EVENT, handleHistoryChanged);
      window.removeEventListener(DRAFT_CHANGED_EVENT, handleDraftChanged);
      window.removeEventListener('storage', handleStorageChanged);
    };
  }, [triggerRefresh]);

  const recentItems = useMemo(() => {
    const recent = getRecentConversations(MAX_ITEMS_PER_TAB);
    return recent
      .map((item) => {
        const conv = convList.find((c) => c.id === item.conversationId);
        return conv ? { ...item, conversation: conv } : null;
      })
      .filter((item): item is ConversationHistoryItem & { conversation: ConversationRow } =>
        item !== null
      );
  }, [convList, refreshCounter]);

  const frequentItems = useMemo(() => {
    const frequent = getFrequentConversations(MAX_ITEMS_PER_TAB);
    return frequent
      .map((item) => {
        const conv = convList.find((c) => c.id === item.conversationId);
        return conv ? { ...item, conversation: conv } : null;
      })
      .filter((item): item is ConversationHistoryItem & { conversation: ConversationRow } =>
        item !== null
      );
  }, [convList, refreshCounter]);

  const draftItems = useMemo(() => {
    const drafts = getDraftConversations();
    return drafts
      .map((draft) => {
        const conv = convList.find((c) => c.id === draft.conversationId);
        return conv ? { ...draft, conversation: conv } : null;
      })
      .filter((item): item is DraftConversation & { conversation: ConversationRow } =>
        item !== null
      )
      .slice(0, MAX_ITEMS_PER_TAB);
  }, [convList, refreshCounter]);

  const hasItems = recentItems.length > 0 || frequentItems.length > 0 || draftItems.length > 0;

  const handleItemClick = useCallback(
    (conversationId: string, e: React.MouseEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd) {
        e.preventDefault();
        e.stopPropagation();
        openInNewTab(conversationId);
      } else {
        void selectConversation(conversationId);
      }
    },
    [selectConversation, openInNewTab]
  );

  const tabs: { key: TabType; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { key: 'recent', label: '最近', icon: IconClock },
    { key: 'frequent', label: '常用', icon: IconStar },
    { key: 'drafts', label: '未完成', icon: IconEdit },
  ];

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'recent':
        return recentItems.map((item) => ({
          id: item.conversationId,
          conversation: item.conversation,
          time: item.visitedAt,
          extra: null,
        }));
      case 'frequent':
        return frequentItems.map((item) => ({
          id: item.conversationId,
          conversation: item.conversation,
          time: item.visitedAt,
          extra: `${item.visitCount} 次`,
        }));
      case 'drafts':
        return draftItems.map((item) => ({
          id: item.conversationId,
          conversation: item.conversation,
          time: item.conversation.updatedAt,
          extra: item.draftContent.length > 30 ? item.draftContent.slice(0, 30) + '...' : item.draftContent,
        }));
      default:
        return [];
    }
  };

  const currentItems = getCurrentItems();

  if (!hasItems && isExpanded) {
    return null;
  }

  const IconComponent = isExpanded ? IconChevronUp : IconChevronDown;

  return (
    <div className="mb-3 shrink-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-1 py-1.5 rounded-lg transition-colors ${
          isExpanded ? 'hover:bg-[#fafafa]' : 'hover:bg-[#fafafa]'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <IconClock className={`h-4 w-4 text-[#a3a3a3] ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#a3a3a3]">
            快捷访问
          </span>
        </div>
        <IconComponent className={`h-3.5 w-3.5 text-[#a3a3a3] ${isNarrow ? 'h-3 w-3' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-1">
          <div className="flex gap-0.5 mb-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.key;
              let count = 0;
              if (tab.key === 'recent') count = recentItems.length;
              else if (tab.key === 'frequent') count = frequentItems.length;
              else if (tab.key === 'drafts') count = draftItems.length;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#fafafa] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#525252]'
                  }`}
                >
                  <TabIcon className={`h-3 w-3 ${isNarrow ? 'h-2.5 w-2.5' : ''}`} />
                  <AdaptiveText narrow="" wide="">
                    {tab.label}
                  </AdaptiveText>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isActive
                          ? 'bg-white/20 text-white/90'
                          : 'bg-[#e5e5e5] text-[#737373]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-0.5">
            {currentItems.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <span className="text-[12px] text-[#a3a3a3]">
                  {activeTab === 'recent' && '暂无最近访问的对话'}
                  {activeTab === 'frequent' && '暂无常用对话'}
                  {activeTab === 'drafts' && '暂无未完成的草稿'}
                </span>
              </div>
            ) : (
              currentItems.map((item) => {
                const isActive = selectedConversationId === item.id;

                let borderColor = 'border-transparent';
                let bgColor = 'hover:bg-[#fafafa]';

                if (isActive) {
                  borderColor = 'border-black/[0.08]';
                  bgColor = 'bg-[#f4f4f5]';
                }

                return (
                  <div
                    key={item.id}
                    className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors ${borderColor} ${bgColor}`}
                  >
                    {isActive && (
                      <div className="w-1 shrink-0 bg-[#171717] rounded-l-xl" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleItemClick(item.id, e)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openInNewTab(item.id);
                      }}
                      className={`min-w-0 flex-1 ${itemPadding} text-left`}
                      title={`点击打开 | Ctrl/Cmd+点击或双击在新标签页打开: ${
                        item.conversation.title?.trim() || '新对话'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`${titleLines} text-[13px] font-medium leading-snug text-[#171717] ${
                            isNarrow ? 'text-[12px]' : ''
                          } ${isWide ? 'text-sm' : ''}`}
                        >
                          {item.conversation.title?.trim() || '新对话'}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {showTime && (
                          <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''}`}>
                            {formatRelativeTime(item.time)}
                          </span>
                        )}
                        {item.extra && (
                          <>
                            <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''}`}>
                              ·
                            </span>
                            <span
                              className={`text-[11px] text-[#737373] ${isWide ? 'text-xs' : ''} truncate max-w-[120px]`}
                              title={typeof item.extra === 'string' ? item.extra : undefined}
                            >
                              {item.extra}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
