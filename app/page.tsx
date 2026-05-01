'use client';

import type { Message } from 'ai';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { message } from 'antd';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ChatSession from '@/components/ChatSession';
import CompareView from '@/components/CompareView';
import FavoriteToastPanel from '@/components/FavoriteToastPanel';
import FavoritePanel from '@/components/FavoritePanel';
import TrashPanel from '@/components/TrashPanel';
import TemplatePanel, { FormModal } from '@/components/TemplatePanel';
import FeedbackPanel from '@/components/FeedbackPanel';
import ExportPanel from '@/components/ExportPanel';
import SettingsPanel from '@/components/SettingsPanel';
import UserStatsPanel from '@/components/UserStatsPanel';
import UserDropdown from '@/components/UserDropdown';
import ResizablePanel, { useLayoutContext, AdaptiveText } from '@/components/ResizablePanel';
import { DEFAULT_OPENROUTER_MODEL_ID, DEFAULT_OPENROUTER_MODEL_LABEL } from '@/lib/openrouter-models';
import { CONVERSATION_STORAGE_KEY, getOrCreateDeviceId } from '@/lib/device';
import { useSettings } from '@/lib/settings';

type ConversationRow = {
  id: string;
  title: string | null;
  modelId: string | null;
  isPinned: boolean | null;
  pinnedAt: string | null;
  orderIndex: number | null;
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
  replyToId: string | null;
  replyToSnapshot: string | null;
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

type TemplateItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

type CompareSide = 'left' | 'right';

type CompareModeState = {
  isActive: boolean;
  left: ChatPayload | null;
  right: ChatPayload | null;
  activeSide: CompareSide;
  selectingForCompare: boolean;
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

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconGripVertical(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
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

function IconTemplate(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function IconSaveAs(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconPackage(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M7.5 4.21 2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9l-5.5-4.79" />
      <polyline points="7.5 16 3.27 13.55" />
      <polyline points="20.73 13.55 16.5 16 12.27 13.55" />
      <line x1="12" y1="22" x2="12" y2="13.55" />
      <path d="M16.5 7.6 12 11 7.5 7.6" />
      <line x1="12" y1="3.45" x2="12" y2="11" />
    </svg>
  );
}

function IconDownload(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconFeedback(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M18 8h-4" />
      <path d="M16 12h-2" />
      <path d="M18 16h-6" />
    </svg>
  );
}

function IconColumns(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

function IconArrowLeft(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconArrowRight(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
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
  reorderConversations: (order: { id: string; orderIndex: number }[]) => Promise<void>;
  favorites: FavoriteItem[];
  trashList: TrashedConversationRow[];
  templates: TemplateItem[];
  onOpenFavorites: () => void;
  onOpenTrash: () => void;
  onOpenTemplates: () => void;
  onOpenFeedback: () => void;
  onOpenExport: () => void;
  onSaveAsTemplate: (conversationId: string) => Promise<void>;
  duplicateConversation: (id: string, e: React.MouseEvent) => void;
  compareMode: CompareModeState;
  enterCompareMode: () => void;
  exitCompareMode: () => void;
  setCompareActiveSide: (side: CompareSide) => void;
  toggleCompareSelecting: () => void;
}

/** useSortable 必须在子组件顶层调用，不能在 SidebarContent 的 map 里调用（会与搜索视图切换时 hooks 数量冲突）。 */
function SortableConversationRow({
  conversation,
  isNarrow,
  isWide,
  itemPadding,
  titleLines,
  showTime,
  selectedConversationId,
  editingConversationId,
  editingTitle,
  setEditingTitle,
  editingInputRef,
  startEditing,
  selectConversation,
  togglePin,
  deleteConversation,
  onSaveAsTemplate,
  duplicateConversation,
  compareMode,
}: {
  conversation: ConversationRow;
  isNarrow: boolean;
  isWide: boolean;
  itemPadding: string;
  titleLines: string;
  showTime: boolean;
  selectedConversationId: string | undefined;
  editingConversationId: string | null;
  editingTitle: string;
  setEditingTitle: (v: string) => void;
  editingInputRef: React.RefObject<HTMLInputElement | null>;
  startEditing: (conversationId: string, currentTitle: string | null) => void;
  selectConversation: (id: string) => Promise<void>;
  togglePin: (id: string, e: React.MouseEvent) => Promise<void>;
  deleteConversation: (id: string, e: React.MouseEvent) => Promise<void>;
  onSaveAsTemplate: (conversationId: string) => Promise<void>;
  duplicateConversation: (id: string, e: React.MouseEvent) => void;
  compareMode: CompareModeState;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: conversation.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const isNormalActive = selectedConversationId === conversation.id;
  const isCompareLeftActive = compareMode.left?.conversationId === conversation.id;
  const isCompareRightActive = compareMode.right?.conversationId === conversation.id;
  const isActiveInCompare = compareMode.isActive && (isCompareLeftActive || isCompareRightActive);
  const active = isNormalActive || isActiveInCompare;

  let borderColor = 'border-transparent';
  let bgColor = 'hover:bg-[#fafafa]';
  
  if (active) {
    borderColor = 'border-black/[0.08]';
    bgColor = 'bg-[#f4f4f5]';
  }

  let sideIndicator = null;
  if (compareMode.isActive) {
    if (isCompareLeftActive) {
      sideIndicator = (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#171717] rounded-l-xl z-10" title="左侧" />
      );
    } else if (isCompareRightActive) {
      sideIndicator = (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#a3a3a3] rounded-l-xl z-10" title="右侧" />
      );
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-all duration-150 ${
        borderColor
      } ${bgColor}`}
    >
      {sideIndicator}
      <div
        {...attributes}
        {...listeners}
        className="flex shrink-0 items-center justify-center px-1.5 text-[#d4d4d4] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title="拖动排序"
      >
        <IconGripVertical className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
      </div>
      <button
        type="button"
        onClick={() => {
          if (editingConversationId !== conversation.id) {
            void selectConversation(conversation.id);
          }
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startEditing(conversation.id, conversation.title);
        }}
        className={`min-w-0 flex-1 ${itemPadding} text-left`}
        title={editingConversationId === conversation.id ? '编辑中...' : `双击重命名: ${conversation.title ?? '新对话'}`}
      >
        {editingConversationId === conversation.id ? (
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
            <span
              className={`${titleLines} text-[13px] font-medium leading-snug text-[#171717] ${
                isNarrow ? 'text-[12px]' : ''
              } ${isWide ? 'text-sm' : ''}`}
            >
              {conversation.title?.trim() || '新对话'}
            </span>
            {showTime && (
              <span className={`mt-1 block text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''}`}>
                {formatRelativeTime(conversation.updatedAt)}
              </span>
            )}
          </>
        )}
      </button>
      <button
        type="button"
        aria-label="置顶会话"
        onClick={(e) => togglePin(conversation.id, e)}
        className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-amber-50 hover:text-[#f59e0b] group-hover:opacity-100 ${
          isNarrow ? 'w-7' : ''
        }`}
        title="置顶会话"
      >
        <IconPin className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
      </button>
      <button
        type="button"
        aria-label="另存为模板"
        onClick={(e) => {
          e.stopPropagation();
          void onSaveAsTemplate(conversation.id);
        }}
        className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-[#f5f5f5] hover:text-[#171717] group-hover:opacity-100 ${
          isNarrow ? 'w-7' : ''
        }`}
        title="另存为模板"
      >
        <IconSaveAs className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
      </button>
      <button
        type="button"
        aria-label="复制对话"
        onClick={(e) => {
          e.stopPropagation();
          void duplicateConversation(conversation.id, e);
        }}
        className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-[#f5f5f5] hover:text-[#171717] group-hover:opacity-100 ${
          isNarrow ? 'w-7' : ''
        }`}
        title="复制对话"
      >
        <IconCopy className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
      </button>
      <button
        type="button"
        aria-label="删除会话"
        onClick={(e) => deleteConversation(conversation.id, e)}
        className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 ${
          isNarrow ? 'w-7' : ''
        }`}
      >
        <IconTrash className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
      </button>
    </div>
  );
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
  reorderConversations,
  favorites,
  trashList,
  templates,
  onOpenFavorites,
  onOpenTrash,
  onOpenTemplates,
  onOpenFeedback,
  onOpenExport,
  onSaveAsTemplate,
  duplicateConversation,
  compareMode,
  enterCompareMode,
  exitCompareMode,
  setCompareActiveSide,
  toggleCompareSelecting,
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

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const unpinnedIds = useMemo(
    () => unpinnedConversations.map((c) => c.id),
    [unpinnedConversations]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = unpinnedConversations.findIndex((c) => c.id === active.id);
      const newIndex = unpinnedConversations.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newOrder = arrayMove(unpinnedConversations, oldIndex, newIndex);
      const orderData = newOrder.map((c, index) => ({
        id: c.id,
        orderIndex: index,
      }));

      await reorderConversations(orderData);
    },
    [unpinnedConversations, reorderConversations]
  );

  const activeConversation = activeId
    ? unpinnedConversations.find((c) => c.id === activeId)
    : null;



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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* 对比模式控制栏 */}
      {compareMode.isActive && (
        <div className="mb-2 rounded-lg border border-black/[0.08] bg-[#fafafa] px-2 py-1.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-[#737373]">对比模式</span>
            <button
              type="button"
              onClick={exitCompareMode}
              className="text-[10px] text-[#a3a3a3] hover:text-[#171717] transition-colors"
            >
              退出
            </button>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCompareActiveSide('left')}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                compareMode.activeSide === 'left'
                  ? 'bg-[#171717] text-white'
                  : 'bg-white text-[#525252] border border-black/[0.08] hover:bg-[#fafafa]'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <IconArrowLeft className="h-2.5 w-2.5" />
                <span>左</span>
              </div>
              <div className="mt-0.5 truncate text-[9px] opacity-70">
                {compareMode.left
                  ? convList.find((c) => c.id === compareMode.left?.conversationId)
                      ?.title?.trim() || '新对话'
                  : '未选'}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setCompareActiveSide('right')}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                compareMode.activeSide === 'right'
                  ? 'bg-[#171717] text-white'
                  : 'bg-white text-[#525252] border border-black/[0.08] hover:bg-[#fafafa]'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span>右</span>
                <IconArrowRight className="h-2.5 w-2.5" />
              </div>
              <div className="mt-0.5 truncate text-[9px] opacity-70">
                {compareMode.right
                  ? convList.find((c) => c.id === compareMode.right?.conversationId)
                      ?.title?.trim() || '新对话'
                  : '未选'}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 新对话按钮 */}
      <div className="mb-3 flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => newChat()}
          disabled={!deviceId || !!loadingMain}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#171717] px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-40 ${
            isNarrow ? 'py-2 text-xs' : ''
          }`}
        >
          <IconPlus className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
          <AdaptiveText narrow="新建" wide="新建对话">
            新对话
          </AdaptiveText>
        </button>
        
        {!compareMode.isActive && convList.length >= 1 && (
          <button
            type="button"
            onClick={enterCompareMode}
            disabled={!deviceId || !!loadingMain}
            className={`flex items-center justify-center gap-1.5 rounded-xl border border-[#d1d5db] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] shadow-sm transition hover:bg-gray-50 disabled:opacity-40 ${
              isNarrow ? 'py-2 text-xs' : ''
            }`}
            title="进入对比模式"
          >
            <IconColumns className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
            <AdaptiveText narrow="对比" wide="对比">
              对比
            </AdaptiveText>
          </button>
        )}
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* 置顶会话（固定在最上面） */}
      {!showSearchResults && pinnedConversations.length > 0 && (
        <>
          <div className={`mb-2 flex items-center justify-between px-1 ${
            isNarrow ? 'mb-1' : ''
          }`}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#a3a3a3]">
              置顶会话
            </p>
          </div>
          <div className="mb-3 flex flex-col gap-0.5">
            {pinnedConversations.map((c) => {
              const isNormalActive = chatPayload?.conversationId === c.id;
              const isCompareLeftActive = compareMode.left?.conversationId === c.id;
              const isCompareRightActive = compareMode.right?.conversationId === c.id;
              const isActiveInCompare = compareMode.isActive && (isCompareLeftActive || isCompareRightActive);
              const active = isNormalActive || isActiveInCompare;
              
              let borderColor = 'border-transparent';
              let bgColor = 'hover:bg-[#fafafa]';
              
              if (active) {
                borderColor = 'border-black/[0.08]';
                bgColor = 'bg-[#f4f4f5]';
              }
              
              let sideIndicator = null;
              if (compareMode.isActive) {
                if (isCompareLeftActive) {
                  sideIndicator = (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#171717] rounded-l-xl" title="左侧" />
                  );
                } else if (isCompareRightActive) {
                  sideIndicator = (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#a3a3a3] rounded-l-xl" title="右侧" />
                  );
                }
              }
              
              return (
                <div
                  key={c.id}
                  className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors ${
                    borderColor
                  } ${bgColor}`}
                >
                  {sideIndicator}
                  {!sideIndicator && (
                    <div className="w-1 shrink-0 bg-[#f59e0b] rounded-l-xl" />
                  )}
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
                    aria-label="另存为模板"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onSaveAsTemplate(c.id);
                    }}
                    className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-[#f5f5f5] hover:text-[#171717] group-hover:opacity-100 ${
                      isNarrow ? 'w-7' : ''
                    }`}
                    title="另存为模板"
                  >
                    <IconSaveAs className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                  </button>
                  <button
                    type="button"
                    aria-label="复制对话"
                    onClick={(e) => {
                      e.stopPropagation();
                      void duplicateConversation(c.id, e);
                    }}
                    className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-[#f5f5f5] hover:text-[#171717] group-hover:opacity-100 ${
                      isNarrow ? 'w-7' : ''
                    }`}
                    title="复制对话"
                  >
                    <IconCopy className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
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

      {/* 搜索框 */}
      <div className={`mb-3 relative shrink-0 ${isNarrow ? 'mb-2' : ''}`}>
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

      {/* 搜索结果或普通会话列表 */}
      {showSearchResults ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-0.5">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex gap-1.5 mb-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/70 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/50" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/30 [animation-delay:0.2s]" />
              </div>
              <p className="text-sm text-[#a3a3a3]">正在搜索...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <IconSearch className="h-8 w-8 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">未找到相关结果</p>
              <p className="text-xs text-[#a3a3a3]">尝试使用其他关键词</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {searchResults.map((result) => (
                <div key={result.conversationId} className="flex flex-col">
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {unpinnedConversations.length > 0 && (
            <p className={`mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-[#a3a3a3] ${
              isNarrow ? 'mb-1 text-[10px]' : ''
            }`}>
              <AdaptiveText narrow="会话" wide="历史会话列表">
                历史会话
              </AdaptiveText>
            </p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={unpinnedIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5">
                {unpinnedConversations.length === 0 && pinnedConversations.length === 0 && !loadingMain && (
                  <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-[#a3a3a3]">
                    暂无会话记录
                  </p>
                )}
                {unpinnedConversations.map((conversation) => (
                  <SortableConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    isNarrow={isNarrow}
                    isWide={isWide}
                    itemPadding={itemPadding}
                    titleLines={titleLines}
                    showTime={showTime}
                    selectedConversationId={chatPayload?.conversationId}
                    editingConversationId={editingConversationId}
                    editingTitle={editingTitle}
                    setEditingTitle={setEditingTitle}
                    editingInputRef={editingInputRef}
                    startEditing={startEditing}
                    selectConversation={selectConversation}
                    togglePin={togglePin}
                    deleteConversation={deleteConversation}
                    onSaveAsTemplate={onSaveAsTemplate}
                    duplicateConversation={duplicateConversation}
                    compareMode={compareMode}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeConversation ? (
                <div className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-[#171717]/20 bg-white shadow-lg">
                  <div className="flex shrink-0 items-center justify-center px-1.5 text-[#a3a3a3]">
                    <IconGripVertical className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                  </div>
                  <div className={`min-w-0 flex-1 ${itemPadding}`}>
                    <span className={`${titleLines} text-[13px] font-medium leading-snug text-[#171717] ${
                      isNarrow ? 'text-[12px]' : ''
                    } ${isWide ? 'text-sm' : ''}`}>
                      {activeConversation.title?.trim() || '新对话'}
                    </span>
                    {showTime && (
                      <span className={`mt-1 block text-[11px] text-[#a3a3a3] ${
                        isWide ? 'text-xs' : ''
                      }`}>
                        {formatRelativeTime(activeConversation.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
      </div>

      {/* 底部图标按钮：模板、收藏、回收站、反馈和导出 */}
      <div className="flex items-center justify-center gap-2 pt-3 border-t border-black/[0.08] shrink-0">
        <button
          type="button"
          onClick={onOpenTemplates}
          className={`relative flex items-center justify-center rounded-lg p-2 transition-colors text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#171717] ${isNarrow ? 'p-1.5' : ''}`}
          title="我的模板"
          aria-label="打开模板列表"
        >
          <IconTemplate className={`h-5 w-5 ${isNarrow ? 'h-4 w-4' : ''}`} />
          {templates.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#171717] text-[10px] font-medium text-white">
              {templates.length > 99 ? '99+' : templates.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenFavorites}
          className={`relative flex items-center justify-center rounded-lg p-2 transition-colors text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#171717] ${isNarrow ? 'p-1.5' : ''}`}
          title="我的收藏"
          aria-label="打开收藏列表"
        >
          <IconBookmark className={`h-5 w-5 ${isNarrow ? 'h-4 w-4' : ''}`} filled={favorites.length > 0} />
          {favorites.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#171717] text-[10px] font-medium text-white">
              {favorites.length > 99 ? '99+' : favorites.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenTrash}
          className={`relative flex items-center justify-center rounded-lg p-2 transition-colors text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#171717] ${isNarrow ? 'p-1.5' : ''}`}
          title="回收站"
          aria-label="打开回收站"
        >
          <IconTrash className={`h-5 w-5 ${isNarrow ? 'h-4 w-4' : ''}`} />
          {trashList.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#171717] text-[10px] font-medium text-white">
              {trashList.length > 99 ? '99+' : trashList.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenFeedback}
          className={`relative flex items-center justify-center rounded-lg p-2 transition-colors text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#171717] ${isNarrow ? 'p-1.5' : ''}`}
          title="反馈统计"
          aria-label="打开反馈统计面板"
        >
          <IconFeedback className={`h-5 w-5 ${isNarrow ? 'h-4 w-4' : ''}`} />
        </button>
        <button
          type="button"
          onClick={onOpenExport}
          className={`relative flex items-center justify-center rounded-lg p-2 transition-colors text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#171717] ${isNarrow ? 'p-1.5' : ''}`}
          title="批量导出对话"
          aria-label="打开批量导出面板"
        >
          <IconDownload className={`h-5 w-5 ${isNarrow ? 'h-4 w-4' : ''}`} />
        </button>
      </div>
    </div>
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
  
  // 浮层面板显示状态
  const [showFavoritePanel, setShowFavoritePanel] = useState<boolean>(false);
  const [showTrashPanel, setShowTrashPanel] = useState<boolean>(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState<boolean>(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState<boolean>(false);
  const [showExportPanel, setShowExportPanel] = useState<boolean>(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [showUserStatsPanel, setShowUserStatsPanel] = useState<boolean>(false);

  // 模板相关状态
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [pendingTemplateContent, setPendingTemplateContent] = useState<string | null>(null);
  
  // 从对话另存为模板相关状态
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState<boolean>(false);
  const [saveAsTemplateData, setSaveAsTemplateData] = useState<{ title: string; content: string } | null>(null);

  // 沉浸模式相关状态
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [showExitButton, setShowExitButton] = useState(false);

  // 对比模式相关状态
  const [compareMode, setCompareMode] = useState<CompareModeState>({
    isActive: false,
    left: null,
    right: null,
    activeSide: 'left',
    selectingForCompare: false,
  });

  // 复制对话相关状态
  const [duplicatingConversationId, setDuplicatingConversationId] = useState<string | null>(null);
  const [showDuplicateConfirmModal, setShowDuplicateConfirmModal] = useState<boolean>(false);
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoArchivedRef = useRef(false);
  const prevAutoArchiveRef = useRef<boolean | null>(null);
  const prevAutoArchiveDaysRef = useRef<number | null>(null);

  const { behavior, keyboardShortcuts } = useSettings();

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

  // 加载模板列表
  const loadTemplates = useCallback(async (did: string) => {
    try {
      const r = await fetch('/api/templates', { headers: { 'x-device-id': did } });
      if (!r.ok) return;
      const data = (await r.json()) as { templates?: TemplateItem[] };
      setTemplates(data.templates ?? []);
    } catch (error) {
      console.error('加载模板列表失败:', error);
      setTemplates([]);
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

  // 自动归档
  const performAutoArchive = useCallback(async (did: string, days: number) => {
    try {
      const r = await fetch('/api/trash/auto-archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': did,
        },
        body: JSON.stringify({ days }),
      });

      if (r.ok) {
        const data = (await r.json()) as { archivedCount?: number };
        if (data.archivedCount && data.archivedCount > 0) {
          await loadConversations(did);
          await loadTrash(did);
        }
      }
    } catch (error) {
      console.error('自动归档失败:', error);
    }
  }, [loadConversations, loadTrash]);

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

  // 打开反馈统计面板
  const handleOpenFeedback = useCallback(() => {
    setShowFeedbackPanel(true);
  }, []);

  // 关闭反馈统计面板
  const handleCloseFeedback = useCallback(() => {
    setShowFeedbackPanel(false);
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

  // 打开收藏浮层面板
  const handleOpenFavorites = useCallback(() => {
    setShowFavoritePanel(true);
  }, []);

  // 关闭收藏浮层面板
  const handleCloseFavorites = useCallback(() => {
    setShowFavoritePanel(false);
  }, []);

  // 打开回收站浮层面板
  const handleOpenTrash = useCallback(() => {
    setShowTrashPanel(true);
  }, []);

  // 关闭回收站浮层面板
  const handleCloseTrash = useCallback(() => {
    setShowTrashPanel(false);
  }, []);

  // 打开批量导出浮层面板
  const handleOpenExport = useCallback(() => {
    setShowExportPanel(true);
  }, []);

  // 关闭批量导出浮层面板
  const handleCloseExport = useCallback(() => {
    setShowExportPanel(false);
  }, []);

  // 处理浮层面板中收藏项的点击
  const handlePanelFavoriteClick = useCallback(async (conversationId: string, messageId: string) => {
    handleCloseFavorites();
    setHighlightMessageId(messageId);
    await selectConversation(conversationId);
  }, [handleCloseFavorites]);

  // 处理浮层面板中取消收藏
  const handlePanelUnfavorite = useCallback(async (favoriteId: string, e: React.MouseEvent) => {
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

  // 处理浮层面板中恢复会话
  const handlePanelRestore = useCallback(async (id: string, e: React.MouseEvent) => {
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

  // 处理浮层面板中彻底删除会话
  const handlePanelDeletePermanently = useCallback(async (id: string) => {
    if (!deviceId) return;

    const r = await fetch(`/api/trash/${id}`, {
      method: 'DELETE',
      headers: { 'x-device-id': deviceId },
    });

    if (r.ok) {
      await loadTrash(deviceId);
    }
  }, [deviceId, loadTrash]);

  // 批量恢复会话
  const handlePanelBatchRestore = useCallback(async (ids: string[]) => {
    if (!deviceId || ids.length === 0) return;

    const r = await fetch('/api/trash/batch-restore', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({ ids }),
    });

    if (r.ok) {
      await loadTrash(deviceId);
      await loadConversations(deviceId);
    }
  }, [deviceId, loadTrash, loadConversations]);

  // 批量彻底删除会话
  const handlePanelBatchDeletePermanently = useCallback(async (ids: string[]) => {
    if (!deviceId || ids.length === 0) return;

    const r = await fetch('/api/trash/batch-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({ ids }),
    });

    if (r.ok) {
      await loadTrash(deviceId);
    }
  }, [deviceId, loadTrash]);

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
            await loadTemplates(did);
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
        await loadTemplates(did);
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

  useEffect(() => {
    if (!deviceId) return;

    const isFirstRun = prevAutoArchiveRef.current === null;

    if (isFirstRun) {
      prevAutoArchiveRef.current = behavior.autoArchive;
      prevAutoArchiveDaysRef.current = behavior.autoArchiveDays as number;

      if (behavior.autoArchive && !hasAutoArchivedRef.current) {
        hasAutoArchivedRef.current = true;
        void performAutoArchive(deviceId, behavior.autoArchiveDays as number);
      }
      return;
    }

    const autoArchiveChanged = behavior.autoArchive !== prevAutoArchiveRef.current;
    const autoArchiveDaysChanged = behavior.autoArchiveDays !== prevAutoArchiveDaysRef.current;

    if (behavior.autoArchive && (autoArchiveChanged || autoArchiveDaysChanged)) {
      void performAutoArchive(deviceId, behavior.autoArchiveDays as number);
    }

    prevAutoArchiveRef.current = behavior.autoArchive;
    prevAutoArchiveDaysRef.current = behavior.autoArchiveDays as number;
  }, [deviceId, behavior.autoArchive, behavior.autoArchiveDays, performAutoArchive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否按下了Ctrl键
      const isCtrlPressed = e.ctrlKey;
      // 检查是否按下了Shift键
      const isShiftPressed = e.shiftKey;
      // 检查是否按下了Alt键
      const isAltPressed = e.altKey;
      // 获取按下的键
      const key = e.key.toUpperCase();

      // 构建当前按下的快捷键字符串
      let currentShortcut = '';
      if (isCtrlPressed) currentShortcut += 'Ctrl+';
      if (isShiftPressed) currentShortcut += 'Shift+';
      if (isAltPressed) currentShortcut += 'Alt+';
      currentShortcut += key;

      // 检查是否匹配新建对话的快捷键
      if (currentShortcut === keyboardShortcuts.newConversation) {
        e.preventDefault();
        void newChat();
      }

      // 检查是否匹配发送消息的快捷键
      if (currentShortcut === keyboardShortcuts.sendMessage) {
        // 发送消息的逻辑将在ChatSession组件中处理
        // 这里只需要阻止默认行为
        e.preventDefault();
      }

      // 检查是否匹配切换模型的快捷键
      if (currentShortcut === keyboardShortcuts.switchModel) {
        e.preventDefault();
        // 切换模型的逻辑将在后续实现
        console.log('切换模型快捷键被触发');
      }

      // 检查是否按下 Escape 键退出沉浸模式
      if (e.key === 'Escape' && isImmersiveMode) {
        e.preventDefault();
        setIsImmersiveMode(false);
      }
    };

    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardShortcuts, newChat, isImmersiveMode]);

  async function selectConversation(id: string) {
    if (!deviceId) return;
    
    if (compareMode.isActive) {
      const r = await fetch(`/api/conversations/${id}/messages`, {
        headers: { 'x-device-id': deviceId },
      });
      if (!r.ok) return;
      const data = (await r.json()) as { messages?: Message[] };
      
      setCompareMode((prev) => ({
        ...prev,
        [prev.activeSide]: {
          conversationId: id,
          messages: data.messages ?? [],
        },
      }));
      return;
    }

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

  const enterCompareMode = useCallback(async () => {
    if (!deviceId) return;
    
    const currentLeft = chatPayload || compareMode.left;
    
    setCompareMode({
      isActive: true,
      left: currentLeft,
      right: null,
      activeSide: 'right',
      selectingForCompare: true,
    });
  }, [deviceId, chatPayload, compareMode.left]);

  const exitCompareMode = useCallback(() => {
    const currentLeft = compareMode.left;
    
    setCompareMode({
      isActive: false,
      left: null,
      right: null,
      activeSide: 'left',
      selectingForCompare: false,
    });
    
    if (currentLeft) {
      setChatPayload(currentLeft);
    }
  }, [compareMode.left]);

  const setCompareActiveSide = useCallback((side: CompareSide) => {
    setCompareMode((prev) => ({
      ...prev,
      activeSide: side,
      selectingForCompare: false,
    }));
  }, []);

  const toggleCompareSelecting = useCallback(() => {
    setCompareMode((prev) => ({
      ...prev,
      selectingForCompare: !prev.selectingForCompare,
    }));
  }, []);

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
      await loadTemplates(deviceId);
    } catch {
      /* ignore */
    }
  }

  // 模板操作函数
  const handleOpenTemplates = useCallback(() => {
    setShowTemplatePanel(true);
  }, []);

  const handleCloseTemplates = useCallback(() => {
    setShowTemplatePanel(false);
  }, []);

  const handleAddTemplate = useCallback(
    async (template: { title: string; content: string; category: string }) => {
      if (!deviceId) return;
      try {
        const r = await fetch('/api/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-id': deviceId,
          },
          body: JSON.stringify(template),
        });
        if (r.ok) {
          await loadTemplates(deviceId);
        }
      } catch (error) {
        console.error('添加模板失败:', error);
      }
    },
    [deviceId, loadTemplates]
  );

  const handleUpdateTemplate = useCallback(
    async (id: string, template: { title?: string; content?: string; category?: string }) => {
      if (!deviceId) return;
      try {
        const r = await fetch(`/api/templates/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-device-id': deviceId,
          },
          body: JSON.stringify(template),
        });
        if (r.ok) {
          await loadTemplates(deviceId);
        }
      } catch (error) {
        console.error('更新模板失败:', error);
      }
    },
    [deviceId, loadTemplates]
  );

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      if (!deviceId) return;
      try {
        const r = await fetch(`/api/templates/${id}`, {
          method: 'DELETE',
          headers: { 'x-device-id': deviceId },
        });
        if (r.ok) {
          await loadTemplates(deviceId);
        }
      } catch (error) {
        console.error('删除模板失败:', error);
      }
    },
    [deviceId, loadTemplates]
  );

  const handleBatchImportTemplate = useCallback(
    async (templates: { title: string; content: string; category: string }[]) => {
      if (!deviceId) return;
      try {
        const r = await fetch('/api/templates/batch-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-id': deviceId,
          },
          body: JSON.stringify({ templates }),
        });
        if (r.ok) {
          await loadTemplates(deviceId);
        } else {
          const errorData = await r.json().catch(() => ({}));
          throw new Error(errorData.error || '批量导入失败');
        }
      } catch (error) {
        console.error('批量导入模板失败:', error);
        throw error;
      }
    },
    [deviceId, loadTemplates]
  );

  const handleTemplateClick = useCallback(
    async (content: string) => {
      setPendingTemplateContent(content);
    },
    []
  );

  const handleTemplateUsed = useCallback(() => {
    setPendingTemplateContent(null);
  }, []);

  const handleForward = useCallback(
    async (targetConversationId: string) => {
      await selectConversation(targetConversationId);
    },
    []
  );

  // 从对话另存为模板相关函数
  const handleCloseSaveAsTemplateModal = useCallback(() => {
    setShowSaveAsTemplateModal(false);
    setSaveAsTemplateData(null);
  }, []);

  const handleSaveAsTemplate = useCallback(
    async (conversationId: string) => {
      if (!deviceId) return;

      try {
        // 获取对话的消息列表
        const r = await fetch(`/api/conversations/${conversationId}/messages`, {
          headers: { 'x-device-id': deviceId },
        });

        if (!r.ok) return;

        const data = (await r.json()) as { messages?: Message[] };
        const messages = data.messages ?? [];

        // 找到第一条用户消息
        const firstUserMessage = messages.find((m) => m.role === 'user');

        if (!firstUserMessage || !firstUserMessage.content.trim()) {
          // 如果没有用户消息，显示提示
          alert('该对话没有用户消息，无法另存为模板');
          return;
        }

        // 获取对话标题作为默认模板标题
        const conversation = convList.find((c) => c.id === conversationId);
        const defaultTitle = conversation?.title?.trim() || '新模板';

        // 设置模板数据并打开弹窗
        setSaveAsTemplateData({
          title: defaultTitle,
          content: firstUserMessage.content,
        });
        setShowSaveAsTemplateModal(true);
      } catch (error) {
        console.error('获取对话消息失败:', error);
      }
    },
    [deviceId, convList]
  );

  const handleCreateTemplateFromConversation = useCallback(
    async (template: { title: string; content: string; category: string }) => {
      await handleAddTemplate(template);
      handleCloseSaveAsTemplateModal();
    },
    [handleAddTemplate, handleCloseSaveAsTemplateModal]
  );

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

  const reorderConversations = useCallback(
    async (order: { id: string; orderIndex: number }[]) => {
      if (!deviceId || order.length === 0) return;

      try {
        const r = await fetch('/api/conversations/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-id': deviceId,
          },
          body: JSON.stringify({ order }),
        });

        if (r.ok) {
          await loadConversations(deviceId);
        }
      } catch (error) {
        console.error('重新排序会话失败:', error);
      }
    },
    [deviceId, loadConversations]
  );

  // 复制对话相关函数
  const duplicateConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDuplicatingConversationId(id);
    setShowDuplicateConfirmModal(true);
  }, []);

  const handleDuplicateConfirm = useCallback(async () => {
    if (!deviceId || !duplicatingConversationId) return;

    setIsDuplicating(true);
    setShowDuplicateConfirmModal(false);

    try {
      const r = await fetch(`/api/conversations/${duplicatingConversationId}/duplicate`, {
        method: 'POST',
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (!r.ok) {
        throw new Error('复制失败');
      }

      const data = (await r.json()) as { 
        id: string; 
        title: string;
        conversations: ConversationRow[];
      };

      if (data.conversations) {
        setConvList(data.conversations);
      }

      setIsDuplicating(false);
      setDuplicatingConversationId(null);

      message.success('复制成功');

      await selectConversation(data.id);
    } catch (error) {
      console.error('复制对话失败:', error);
      setIsDuplicating(false);
      setDuplicatingConversationId(null);
      message.error('复制对话失败，请稍后重试');
    }
  }, [deviceId, duplicatingConversationId, selectConversation]);

  const handleDuplicateCancel = useCallback(() => {
    setShowDuplicateConfirmModal(false);
    setDuplicatingConversationId(null);
  }, []);

  const loadingMain = !!(deviceId && !chatPayload && !bootstrapError);

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      <header className={`z-30 shrink-0 border-b border-[rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out ${
        isImmersiveMode ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100'
      }`}>
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
          <div className="flex items-center gap-2">
            <p className="shrink-0 max-w-[min(52vw,14rem)] truncate text-right text-[11px] text-[#666666] sm:max-w-none sm:text-xs" title="当前对话模型">
              {DEFAULT_OPENROUTER_MODEL_LABEL}
            </p>
            <UserDropdown
              onOpenSettings={() => setShowSettingsPanel(true)}
              onOpenUserStats={() => setShowUserStatsPanel(true)}
            />
          </div>
        </div>
      </header>

      <div className={`mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col gap-0 overflow-hidden px-3 pb-4 pt-4 sm:flex-row sm:px-5 sm:pb-6 sm:pt-5 transition-all duration-300 ease-in-out ${isImmersiveMode ? 'max-w-none px-0 py-0' : ''}`}>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isImmersiveMode ? 'opacity-0 w-0 shrink-0' : 'opacity-100'
        }`}>
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
              reorderConversations={reorderConversations}
              favorites={favorites}
              trashList={trashList}
              templates={templates}
              onOpenFavorites={handleOpenFavorites}
              onOpenTrash={handleOpenTrash}
              onOpenTemplates={handleOpenTemplates}
              onOpenFeedback={handleOpenFeedback}
              onOpenExport={handleOpenExport}
              onSaveAsTemplate={handleSaveAsTemplate}
              duplicateConversation={duplicateConversation}
              compareMode={compareMode}
              enterCompareMode={enterCompareMode}
              exitCompareMode={exitCompareMode}
              setCompareActiveSide={setCompareActiveSide}
              toggleCompareSelecting={toggleCompareSelecting}
            />
          </ResizablePanel>
        </div>

        <main className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${isImmersiveMode ? 'bg-white' : ''}`}>
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

          {compareMode.isActive ? (
            <CompareView
              deviceId={deviceId!}
              leftConversationId={compareMode.left?.conversationId ?? null}
              rightConversationId={compareMode.right?.conversationId ?? null}
              leftInitialMessages={compareMode.left?.messages ?? []}
              rightInitialMessages={compareMode.right?.messages ?? []}
              activeSide={compareMode.activeSide}
              onActiveSideChange={setCompareActiveSide}
              onExitCompare={exitCompareMode}
              leftTitle={compareMode.left
                ? convList.find((c) => c.id === compareMode.left?.conversationId)?.title ?? null
                : null}
              rightTitle={compareMode.right
                ? convList.find((c) => c.id === compareMode.right?.conversationId)?.title ?? null
                : null}
              favoriteMessageIds={new Set(favorites.map((fav) => fav.messageId))}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : deviceId && chatPayload ? (
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
                templateContent={pendingTemplateContent}
                onTemplateUsed={handleTemplateUsed}
                onToggleImmersiveMode={() => setIsImmersiveMode(true)}
                isImmersiveMode={isImmersiveMode}
                conversations={convList}
                currentConversationTitle={convList.find(c => c.id === chatPayload.conversationId)?.title ?? null}
                onForward={handleForward}
              />
            </div>
          ) : null}
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

      {/* 收藏浮层面板 */}
      <FavoritePanel
        visible={showFavoritePanel}
        onClose={handleCloseFavorites}
        favorites={favorites}
        onFavoriteClick={handlePanelFavoriteClick}
        onUnfavorite={handlePanelUnfavorite}
      />

      {/* 回收站浮层面板 */}
      <TrashPanel
        visible={showTrashPanel}
        onClose={handleCloseTrash}
        trashList={trashList}
        onRestore={handlePanelRestore}
        onDeletePermanently={handlePanelDeletePermanently}
        onBatchRestore={handlePanelBatchRestore}
        onBatchDeletePermanently={handlePanelBatchDeletePermanently}
      />

      {/* 模板浮层面板 */}
      <TemplatePanel
        visible={showTemplatePanel}
        onClose={handleCloseTemplates}
        templates={templates}
        onTemplateClick={handleTemplateClick}
        onAddTemplate={handleAddTemplate}
        onUpdateTemplate={handleUpdateTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onBatchImport={handleBatchImportTemplate}
        onImportComplete={async () => {
          if (deviceId) {
            await loadTemplates(deviceId);
          }
        }}
      />

      {/* 反馈统计浮层面板 */}
      <FeedbackPanel
        visible={showFeedbackPanel}
        onClose={handleCloseFeedback}
      />

      {/* 批量导出浮层面板 */}
      {deviceId && (
        <ExportPanel
          visible={showExportPanel}
          onClose={handleCloseExport}
          conversations={convList}
          deviceId={deviceId}
        />
      )}

      {/* 从对话另存为模板弹窗 */}
      <FormModal
        visible={showSaveAsTemplateModal}
        onClose={handleCloseSaveAsTemplateModal}
        initialValues={saveAsTemplateData}
        mode="save-as"
        onSubmit={handleCreateTemplateFromConversation}
      />

      {/* 复制对话确认弹窗 */}
      {showDuplicateConfirmModal && duplicatingConversationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleDuplicateCancel}>
          <div
            className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] p-4">
              <h3 className="text-lg font-semibold text-[#171717]">复制对话</h3>
              <button
                type="button"
                onClick={handleDuplicateCancel}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#171717] transition-colors"
                aria-label="关闭"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 rounded-xl bg-[#fafafa] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <IconCopy className="h-5 w-5 text-[#171717]" />
                  <span className="text-sm font-medium text-[#171717]">
                    {convList.find(c => c.id === duplicatingConversationId)?.title?.trim() || '新对话'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#737373] mb-4">
                将创建一个完全相同的副本，包括所有历史消息和模型设置。
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDuplicateCancel}
                  className="flex-1 rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#fafafa]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateConfirm}
                  disabled={isDuplicating}
                  className="flex-1 rounded-xl bg-[#171717] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDuplicating && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isDuplicating ? '正在复制...' : '确认复制'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用记录面板 */}
      <UserStatsPanel
        visible={showUserStatsPanel}
        onClose={() => setShowUserStatsPanel(false)}
      />

      {/* 外观设置面板 */}
      <SettingsPanel
        visible={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        onTrashEmptied={() => {
          if (deviceId) {
            loadTrash(deviceId);
          }
        }}
      />

      {/* 沉浸模式退出按钮 */}
      {isImmersiveMode && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-16 cursor-pointer"
          onMouseEnter={() => setShowExitButton(true)}
          onMouseLeave={() => setShowExitButton(false)}
        >
          <button
            onClick={() => setIsImmersiveMode(false)}
            className={`absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-300 ${
              showExitButton
                ? 'bg-black/70 opacity-100'
                : 'bg-black/30 opacity-0'
            }`}
            onMouseEnter={() => setShowExitButton(true)}
            onMouseLeave={() => setShowExitButton(false)}
          >
            <IconX className="h-4 w-4" />
            <span>退出沉浸模式</span>
          </button>
        </div>
      )}
    </div>
  );
}
