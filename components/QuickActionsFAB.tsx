'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

function IconGear(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43-.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
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

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconStar(props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

interface QuickActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

interface QuickActionsFABProps {
  onNewChat: () => void;
  onSearch: () => void;
  onFavorites: () => void;
  onSettings: () => void;
  isImmersiveMode?: boolean;
}

const FAN_RADIUS = 105;
const MAIN_BUTTON_SIZE = 56;
const ITEM_SIZE = 48;
const DELAY_BETWEEN_ITEMS = 70;

const MAIN_BUTTON_HALF = MAIN_BUTTON_SIZE / 2;
const ITEM_HALF = ITEM_SIZE / 2;

export default function QuickActionsFAB({
  onNewChat,
  onSearch,
  onFavorites,
  onSettings,
  isImmersiveMode = false,
}: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const containerRef = useRef<HTMLDivElement>(null);

  const actionItems: QuickActionItem[] = [
    {
      id: 'newChat',
      icon: <IconPlus className="h-5 w-5" />,
      label: '新建对话',
      onClick: onNewChat,
      color: 'bg-[#171717] text-white hover:bg-black dark:bg-white dark:text-[#171717] dark:hover:bg-gray-200',
    },
    {
      id: 'search',
      icon: <IconSearch className="h-5 w-5" />,
      label: '搜索',
      onClick: onSearch,
      color: 'bg-[#3b82f6] text-white hover:bg-[#2563eb]',
    },
    {
      id: 'favorites',
      icon: <IconStar className="h-5 w-5" />,
      label: '收藏',
      onClick: onFavorites,
      color: 'bg-[#f59e0b] text-white hover:bg-[#d97706]',
    },
    {
      id: 'settings',
      icon: <IconGear className="h-5 w-5" />,
      label: '设置',
      onClick: onSettings,
      color: 'bg-[#737373] text-white hover:bg-[#525252]',
    },
  ];

  const getAngle = (index: number, total: number) => {
    const startAngle = 180;
    const endAngle = 270;
    const step = (endAngle - startAngle) / (total - 1);
    return startAngle + index * step;
  };

  const getPosition = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  };

  const handleToggle = useCallback(() => {
    if (animationState === 'opening' || animationState === 'closing') return;

    if (isOpen) {
      setAnimationState('closing');
      setTimeout(() => {
        setIsOpen(false);
        setAnimationState('closed');
      }, actionItems.length * DELAY_BETWEEN_ITEMS + 300);
    } else {
      setIsOpen(true);
      setAnimationState('opening');
      setTimeout(() => {
        setAnimationState('open');
      }, actionItems.length * DELAY_BETWEEN_ITEMS + 300);
    }
  }, [isOpen, animationState, actionItems.length]);

  const handleItemClick = useCallback(
    (item: QuickActionItem) => {
      item.onClick();
      setAnimationState('closing');
      setTimeout(() => {
        setIsOpen(false);
        setAnimationState('closed');
      }, 200);
    },
    []
  );

  const handleClose = useCallback(() => {
    if (animationState === 'closing' || animationState === 'closed') return;
    setAnimationState('closing');
    setTimeout(() => {
      setIsOpen(false);
      setAnimationState('closed');
    }, actionItems.length * DELAY_BETWEEN_ITEMS + 300);
  }, [animationState, actionItems.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  if (isImmersiveMode) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
          style={{
            opacity: animationState === 'opening' || animationState === 'open' ? 1 : 0,
          }}
          onClick={handleClose}
        />
      )}

      <div
        ref={containerRef}
        className="fixed right-5 bottom-20 z-50"
        style={{
          width: MAIN_BUTTON_SIZE,
          height: MAIN_BUTTON_SIZE,
        }}
      >
        {actionItems.map((item, index) => {
          const angle = getAngle(index, actionItems.length);
          const { x, y } = getPosition(angle, FAN_RADIUS);

          const isOpening = animationState === 'opening';
          const delay = isOpening
            ? index * DELAY_BETWEEN_ITEMS
            : (actionItems.length - 1 - index) * DELAY_BETWEEN_ITEMS;

          const finalX = MAIN_BUTTON_HALF + x - ITEM_HALF;
          const finalY = MAIN_BUTTON_HALF + y - ITEM_HALF;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              aria-label={item.label}
              className={`absolute flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${item.color}`}
              style={{
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                left: isOpen ? finalX : MAIN_BUTTON_HALF - ITEM_HALF,
                top: isOpen ? finalY : MAIN_BUTTON_HALF - ITEM_HALF,
                transform: isOpen ? 'scale(1)' : 'scale(0)',
                opacity: isOpen ? 1 : 0,
                transitionProperty: 'left, top, transform, opacity',
                transitionDuration: '350ms',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: `${delay}ms`,
              }}
            >
              {item.icon}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleToggle}
          className="absolute left-0 top-0 flex items-center justify-center rounded-full bg-[#171717] text-white shadow-xl transition-all duration-300 hover:bg-black hover:shadow-2xl active:scale-95 dark:bg-white dark:text-[#171717] dark:hover:bg-gray-200"
          style={{
            width: MAIN_BUTTON_SIZE,
            height: MAIN_BUTTON_SIZE,
          }}
          aria-label={isOpen ? '关闭快捷菜单' : '打开快捷菜单'}
          aria-expanded={isOpen}
        >
          <IconPlus
            className="h-7 w-7 transition-transform duration-300"
            style={{
              transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          />
        </button>
      </div>
    </>
  );
}
