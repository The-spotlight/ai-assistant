'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { isSameDay } from '@/components/DateSeparator';
import { formatRelativeTime } from '@/lib/date-utils';

export type ConversationRow = {
  id: string;
  title: string | null;
  modelId: string | null;
  isPinned: boolean | null;
  pinnedAt: string | null;
  orderIndex: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CompareSide = 'left' | 'right';

export type CompareModeState = {
  isActive: boolean;
  left: { conversationId: string } | null;
  right: { conversationId: string } | null;
  activeSide: CompareSide;
  selectingForCompare: boolean;
};

function IconGripVertical(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="9" cy="5" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function IconPin(props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const filled = props.filled;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 17v5" />
      {filled ? (
        <>
          <path d="M5 9v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2l-3 6h-10l-3-6z" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M5 9v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2l-3 6h-10l-3-6z" />
        </>
      )}
    </svg>
  );
}

function IconSaveAs(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function formatCreatedAtDisplay(createdAt: string, updatedAt: string): string {
  const createdDate = new Date(createdAt);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const created = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
  
  const diffDays = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  
  if (isSameDay(createdAt, updatedAt)) {
    if (diffDays === 0) {
      return '今天创建';
    } else if (diffDays === 1) {
      return '昨天创建';
    }
  } else {
    if (diffDays === 0) {
      return '今天创建';
    } else if (diffDays === 1) {
      return '昨天创建';
    }
  }
  
  const month = createdDate.getMonth() + 1;
  const day = createdDate.getDate();
  return `创建于 ${month} 月 ${day} 日`;
}

export function formatFullDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

type ConversationListItemProps = {
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
  compareMode: CompareModeState;
};

export default function ConversationListItem({
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
  compareMode,
}: ConversationListItemProps) {
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

  const createdAtDisplay = formatCreatedAtDisplay(conversation.createdAt, conversation.updatedAt);
  const fullCreatedAt = formatFullDateTime(conversation.createdAt);

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
              <div className="mt-1 flex items-center gap-1">
                <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''}`}>
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
                <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''}`}>
                  ·
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''} cursor-default`}>
                      {createdAtDisplay}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {fullCreatedAt}
                  </TooltipContent>
                </Tooltip>
              </div>
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

type ConversationTimeDisplayProps = {
  createdAt: string;
  updatedAt: string;
  isNarrow: boolean;
  isWide: boolean;
};

export function ConversationTimeDisplay({
  createdAt,
  updatedAt,
  isNarrow,
  isWide,
}: ConversationTimeDisplayProps) {
  const createdAtDisplay = formatCreatedAtDisplay(createdAt, updatedAt);
  const fullCreatedAt = formatFullDateTime(createdAt);

  return (
    <div className="mt-1 flex items-center gap-1">
      <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''}`}>
        {formatRelativeTime(updatedAt)}
      </span>
      <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''}`}>
        ·
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-[11px] text-[#a3a3a3] ${isWide ? 'text-xs' : ''} cursor-default`}>
            {createdAtDisplay}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {fullCreatedAt}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
