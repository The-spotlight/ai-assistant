'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Message } from 'ai';

export type TabItem = {
  id: string;
  conversationId: string;
  title: string;
  messagesLength: number;
  orderIndex: number;
  openedAt: number;
  messages?: Message[];
};

type TabBarProps = {
  tabs: TabItem[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (oldIndex: number, newIndex: number) => void;
  onNewTab: () => void;
};

function IconX(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconPlus(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SortableTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: {
  tab: TabItem;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-[#f4f4f5] border border-black/[0.08] shadow-sm'
          : 'hover:bg-[#fafafa] border border-transparent'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex shrink-0 items-center justify-center text-[#d4d4d4] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title="拖动排序"
      >
        <IconGripVertical className="h-3.5 w-3.5" />
      </div>
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 text-left"
      >
        <span className={`text-xs font-medium truncate ${
          isActive ? 'text-[#171717]' : 'text-[#737373]'
        }`}>
          {tab.title || '新对话'}
        </span>
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex shrink-0 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/[0.05] p-0.5"
        title="关闭标签"
        aria-label="关闭标签"
      >
        <IconX className="h-3 w-3 text-[#a3a3a3] hover:text-[#525252]" />
      </button>
    </div>
  );
}

function IconGripVertical(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="9" cy="5" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

export default function TabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabReorder,
  onNewTab,
}: TabBarProps) {
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

  const tabIds = useMemo(
    () => tabs.map((t) => t.id),
    [tabs]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = tabs.findIndex((t) => t.id === active.id);
      const newIndex = tabs.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      onTabReorder(oldIndex, newIndex);
    },
    [tabs, onTabReorder]
  );

  const activeTab = activeId
    ? tabs.find((t) => t.id === activeId)
    : null;

  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div className="shrink-0 border-b border-black/[0.06] bg-white/95 backdrop-blur-sm px-3 py-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-1 min-w-0">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0">
              {tabs.map((tab) => (
                <SortableTabItem
                  key={tab.id}
                  tab={tab}
                  isActive={activeTabId === tab.id}
                  onClick={() => onTabClick(tab.id)}
                  onClose={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onNewTab}
              className="flex shrink-0 items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[#a3a3a3] hover:text-[#525252] hover:bg-[#fafafa] transition-all"
              title="新建标签页"
              aria-label="新建标签页"
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
        </SortableContext>
        <DragOverlay>
          {activeTab ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] shadow-lg">
              <div className="flex shrink-0 items-center justify-center text-[#d4d4d4]">
                <IconGripVertical className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-[#171717] truncate">
                {activeTab.title || '新对话'}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
