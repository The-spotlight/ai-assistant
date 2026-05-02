'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout, Copy, Edit3, Trash2 } from 'lucide-react';

interface ContextMenuOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
}

interface MessageContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  messageRole: string;
  onOpenArtboard: () => void;
  onClose: () => void;
  onCopy?: () => void;
}

function IconArtboard(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M9 3v18" />
      <path d="M9 9h12" />
    </svg>
  );
}

export default function MessageContextMenu({
  isOpen,
  position,
  messageRole,
  onOpenArtboard,
  onClose,
  onCopy,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + menuRect.width > viewportWidth - 10) {
      x = viewportWidth - menuRect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }
    if (y + menuRect.height > viewportHeight - 10) {
      y = viewportHeight - menuRect.height - 10;
    }
    if (y < 10) {
      y = 10;
    }

    setAdjustedPosition({ x, y });
  }, [isOpen, position]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const options: ContextMenuOption[] = [
    {
      id: 'open-artboard',
      label: '打开画板',
      icon: <IconArtboard className="h-4 w-4" />,
    },
    {
      id: 'divider-1',
      label: '',
      divider: true,
    },
    ...(onCopy
      ? [
          {
            id: 'copy',
            label: '复制内容',
            icon: <Copy className="h-4 w-4" />,
          } as ContextMenuOption,
        ]
      : []),
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#262626] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        <div className="px-3 py-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
            {messageRole === 'user' ? '我的消息' : 'AI 回复'}
          </p>
        </div>
        <div className="h-px bg-black/[0.06] dark:bg-white/10" />
        {options.map((option) => {
          if (option.divider) {
            return (
              <div
                key={option.id}
                className="h-px bg-black/[0.06] dark:bg-white/10 my-1"
              />
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (option.id === 'open-artboard') {
                  onOpenArtboard();
                } else if (option.id === 'copy' && onCopy) {
                  onCopy();
                }
                onClose();
              }}
              disabled={option.disabled}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#171717] transition-colors hover:bg-[#fafafa] dark:text-white dark:hover:bg-[#3d3d3d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex h-4 w-4 items-center justify-center text-[#737373] dark:text-[#a3a3a3]">
                {option.icon}
              </span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ContextMenuHookResult {
  contextMenuState: {
    isOpen: boolean;
    position: { x: number; y: number };
    messageId: string | null;
    messageRole: string;
    messageContent: string;
  };
  handleContextMenu: (
    e: React.MouseEvent,
    messageId: string,
    messageRole: string,
    messageContent: string
  ) => void;
  closeContextMenu: () => void;
}

export function useMessageContextMenu(): ContextMenuHookResult {
  const [contextMenuState, setContextMenuState] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    messageId: null as string | null,
    messageRole: '',
    messageContent: '',
  });

  const handleContextMenu = useCallback(
    (
      e: React.MouseEvent,
      messageId: string,
      messageRole: string,
      messageContent: string
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        messageId,
        messageRole,
        messageContent,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenuState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    contextMenuState,
    handleContextMenu,
    closeContextMenu,
  };
}
