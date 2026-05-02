'use client';

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

function TabItemComponent({
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-all duration-200 ease-out ${
        isActive
          ? 'bg-white/90 border-t border-l border-r border-black/[0.08] rounded-t-lg shadow-[0_-1px_3px_rgba(0,0,0,0.04)]'
          : 'hover:bg-white/40 text-[#737373] hover:text-[#525252]'
      }`}
    >
      <span className={`text-sm font-medium truncate ${
        isActive ? 'text-[#171717]' : ''
      }`}>
        {tab.title || '新对话'}
      </span>
      <button
        type="button"
        onClick={onClose}
        className={`flex shrink-0 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/[0.05] p-0.5 ml-1`}
        title="关闭标签"
        aria-label="关闭标签"
      >
        <IconX className="h-3.5 w-3.5 text-[#a3a3a3] hover:text-[#525252] transition-colors" />
      </button>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/90" />
      )}
    </button>
  );
}

export default function TabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}: TabBarProps) {
  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div className="shrink-0 border-b border-black/[0.08] bg-[#fafafa]/80 backdrop-blur-sm">
      <div className="flex items-end px-3 pt-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <TabItemComponent
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            onClick={() => onTabClick(tab.id)}
            onClose={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onTabClose(tab.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
