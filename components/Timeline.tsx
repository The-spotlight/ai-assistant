'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Message } from 'ai';
import { Tooltip } from 'antd';
import { useSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';

type MessageWithTokens = Message & {
  createdAt?: string;
};

type TimelineProps = {
  messages: MessageWithTokens[];
  onJumpToMessage: (messageId: string) => void;
  isImmersiveMode?: boolean;
};

export default function Timeline({
  messages,
  onJumpToMessage,
  isImmersiveMode = false,
}: TimelineProps) {
  const { settings } = useSettings();
  const isDarkMode = settings.darkMode;
  const [sliderValue, setSliderValue] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

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

  const getDotColor = useCallback((message: Message) => {
    if (isDarkMode) {
      return message.role === 'user' ? '#60a5fa' : '#525252';
    }
    return message.role === 'user' ? '#171717' : '#a3a3a3';
  }, [isDarkMode]);

  const updateSliderFromScroll = useCallback(() => {
    if (isDragging) return;
    
    const container = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    if (scrollHeight <= 0) {
      setSliderValue(100);
      return;
    }

    const position = (scrollTop / scrollHeight) * 100;
    setSliderValue(Math.max(0, Math.min(100, position)));
  }, [isDragging]);

  useEffect(() => {
    const container = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    if (!container) return;

    container.addEventListener('scroll', updateSliderFromScroll, { passive: true });
    return () => container.removeEventListener('scroll', updateSliderFromScroll);
  }, [updateSliderFromScroll]);

  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  const handleSliderAfterChange = useCallback((value: number) => {
    setIsDragging(false);
    
    if (validMessages.length === 0) return;

    const index = Math.round((value / 100) * (validMessages.length - 1));
    const clampedIndex = Math.max(0, Math.min(validMessages.length - 1, index));
    const message = validMessages[clampedIndex];

    if (message) {
      onJumpToMessage(message.id);
    }
  }, [validMessages, onJumpToMessage]);

  const handleDotClick = useCallback((messageId: string) => {
    onJumpToMessage(messageId);
  }, [onJumpToMessage]);

  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleSliderTrackClick(e);
  }, []);

  const handleSliderTrackClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const trackRect = timelineRef.current.getBoundingClientRect();
    const trackTop = trackRect.top + 40;
    const trackHeight = trackRect.height - 80;

    const relativeY = e.clientY - trackTop;
    let position = (relativeY / trackHeight) * 100;
    position = Math.max(0, Math.min(100, position));

    handleSliderChange(position);
  }, [handleSliderChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && timelineRef.current) {
        const trackRect = timelineRef.current.getBoundingClientRect();
        const trackTop = trackRect.top + 40;
        const trackHeight = trackRect.height - 80;

        const relativeY = e.clientY - trackTop;
        let position = (relativeY / trackHeight) * 100;
        position = Math.max(0, Math.min(100, position));

        handleSliderChange(position);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleSliderAfterChange(sliderValue);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sliderValue, handleSliderChange, handleSliderAfterChange]);

  if (isImmersiveMode || validMessages.length === 0) {
    return null;
  }

  const lineColor = isDarkMode ? '#404040' : '#e5e5e5';
  const sliderRailColor = isDarkMode ? '#262626' : '#f5f5f5';
  const sliderHandleColor = isDarkMode ? '#d4d4d4' : '#525252';
  const textMuted = isDarkMode ? '#a3a3a3' : '#737373';

  return (
    <div
      ref={timelineRef}
      className={cn(
        'absolute right-0 top-0 bottom-0 flex flex-col items-center justify-between py-3 z-50',
        'transition-opacity duration-300',
        isDragging ? 'opacity-100' : 'opacity-60 hover:opacity-100'
      )}
      style={{ width: '64px' }}
    >
      <div
        className="text-[10px] font-medium mb-2"
        style={{ color: textMuted }}
      >
        最早
      </div>

      <div className="flex-1 w-full flex items-stretch justify-center gap-1 my-1 relative">
        <div className="flex-1 flex flex-col items-center justify-start py-1 relative">
          <div
            className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
            style={{ backgroundColor: lineColor }}
          />

          <div className="relative w-full h-full z-10">
            {validMessages.map((message, index) => {
              const position = validMessages.length <= 1 
                ? 50 
                : (index / (validMessages.length - 1)) * 100;
              
              return (
                <div
                  key={message.id}
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: `${position}%` }}
                >
                  <Tooltip
                    title={
                      <div className="flex flex-col gap-1 py-0.5">
                        <span className="font-medium text-sm">{formatTime(message.createdAt)}</span>
                        <span className="text-xs opacity-80">{getMessagePreview(message)}</span>
                      </div>
                    }
                    placement="left"
                    mouseEnterDelay={0.1}
                    zIndex={9999}
                  >
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full cursor-pointer transition-all duration-200',
                        'hover:scale-150 hover:shadow-lg border-2',
                        'active:scale-125'
                      )}
                      style={{
                        backgroundColor: getDotColor(message),
                        borderColor: isDarkMode ? '#262626' : '#ffffff',
                      }}
                      onClick={() => handleDotClick(message.id)}
                    />
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="w-6 h-full flex flex-col items-center py-1 cursor-pointer relative select-none"
          onMouseDown={handleSliderMouseDown}
        >
          <div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1.5 rounded-full"
            style={{ backgroundColor: sliderRailColor }}
          />

          <div
            className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-md border-2 transition-all duration-150 z-10"
            style={{
              top: `calc(${sliderValue}% - 10px)`,
              backgroundColor: sliderHandleColor,
              borderColor: isDarkMode ? '#262626' : '#ffffff',
              cursor: 'grab',
            }}
          />
        </div>
      </div>

      <div
        className="text-[10px] font-medium mt-2"
        style={{ color: textMuted }}
      >
        最新
      </div>
    </div>
  );
}
