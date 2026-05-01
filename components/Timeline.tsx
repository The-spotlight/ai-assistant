'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { Message } from 'ai';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

type MessageWithTokens = Message & {
  createdAt?: string;
};

type TimelineProps = {
  messages: MessageWithTokens[];
  messageRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onJumpToMessage: (messageId: string) => void;
  isImmersiveMode?: boolean;
};

export default function Timeline({
  messages,
  messageRefs,
  onJumpToMessage,
  isImmersiveMode = false,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(100);
  const [hoveredDotId, setHoveredDotId] = useState<string | null>(null);

  const validMessages = useMemo(() => {
    return messages.filter((m): m is MessageWithTokens & { createdAt: string } => 
      m.createdAt != null
    );
  }, [messages]);

  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getMessagePreview = useCallback((message: Message) => {
    const role = message.role === 'user' ? '我' : 'AI';
    const content = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
    return `${role}: ${content}`;
  }, []);

  const getDotPosition = useCallback((index: number, total: number) => {
    if (total <= 1) return 50;
    return (index / (total - 1)) * 100;
  }, []);

  const handleDotClick = useCallback((messageId: string) => {
    onJumpToMessage(messageId);
  }, [onJumpToMessage]);

  const updateSliderFromScroll = useCallback(() => {
    if (isDragging) return;
    
    const container = document.querySelector('[data-scroll-container]');
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    if (scrollHeight <= 0) {
      setSliderPosition(100);
      return;
    }

    const position = (scrollTop / scrollHeight) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  }, [isDragging]);

  useEffect(() => {
    const container = document.querySelector('[data-scroll-container]');
    if (!container) return;

    container.addEventListener('scroll', updateSliderFromScroll, { passive: true });
    return () => container.removeEventListener('scroll', updateSliderFromScroll);
  }, [updateSliderFromScroll]);

  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleSliderMove = useCallback((clientY: number) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const timelineTop = rect.top + 24;
    const timelineHeight = rect.height - 48;

    const relativeY = clientY - timelineTop;
    let position = (relativeY / timelineHeight) * 100;
    position = Math.max(0, Math.min(100, position));

    setSliderPosition(position);
  }, []);

  const handleSliderRelease = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (validMessages.length === 0) return;

    const position = sliderPosition;
    const index = Math.round((position / 100) * (validMessages.length - 1));
    const clampedIndex = Math.max(0, Math.min(validMessages.length - 1, index));
    const message = validMessages[clampedIndex];

    if (message) {
      onJumpToMessage(message.id);
    }
  }, [isDragging, sliderPosition, validMessages, onJumpToMessage]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSliderMove(e.clientY);
      }
    };

    const handleMouseUp = () => {
      handleSliderRelease();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSliderMove, handleSliderRelease]);

  if (isImmersiveMode || validMessages.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div
        ref={timelineRef}
        className={cn(
          'absolute right-0 top-0 bottom-0 w-8 flex flex-col items-center justify-between py-3 z-10',
          'transition-opacity duration-300',
          isDragging ? 'opacity-100' : 'opacity-60 hover:opacity-100'
        )}
      >
        <div className="text-[10px] text-[#a3a3a3] font-medium mb-1">最早</div>

        <div className="relative flex-1 w-1 flex flex-col items-center my-1">
          <div className="absolute inset-0 w-0.5 bg-gradient-to-b from-[#e5e5e5] via-[#d4d4d4] to-[#e5e5e5] dark:from-[#404040] dark:via-[#525252] dark:to-[#404040] rounded-full" />

          {validMessages.map((message, index) => {
            const position = getDotPosition(index, validMessages.length);
            const isHovered = hoveredDotId === message.id;

            return (
              <Tooltip key={message.id} open={isHovered}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full cursor-pointer transition-all duration-200',
                      'hover:scale-150 hover:shadow-lg',
                      isHovered
                        ? 'bg-[#525252] dark:bg-[#d4d4d4] scale-150 shadow-lg'
                        : 'bg-[#a3a3a3] dark:bg-[#737373]'
                    )}
                    style={{ top: `${position}%` }}
                    onMouseEnter={() => setHoveredDotId(message.id)}
                    onMouseLeave={() => setHoveredDotId(null)}
                    onClick={() => handleDotClick(message.id)}
                  />
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={8} className="max-w-48">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-[#171717]">
                      {formatTime(message.createdAt)}
                    </span>
                    <span className="text-[#737373] text-xs">
                      {getMessagePreview(message)}
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <div
            ref={sliderRef}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full cursor-grab active:cursor-grabbing transition-all duration-200',
              'bg-[#525252] dark:bg-[#d4d4d4] shadow-md border-2 border-white dark:border-[#262626]',
              isDragging ? 'scale-125 shadow-lg' : 'hover:scale-110'
            )}
            style={{ top: `calc(${sliderPosition}% - 8px)` }}
            onMouseDown={handleSliderMouseDown}
          />
        </div>

        <div className="text-[10px] text-[#a3a3a3] font-medium mt-1">最新</div>
      </div>
    </TooltipProvider>
  );
}
