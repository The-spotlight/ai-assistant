'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Message } from 'ai';
import { Timeline as AntTimeline, Tooltip, Slider, ConfigProvider } from 'antd';
import type { TimelineItemProps } from 'antd/es/timeline';
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

  const timelineItems: TimelineItemProps[] = useMemo(() => {
    return validMessages.map((message) => ({
      key: message.id,
      dot: (
        <Tooltip
          title={
            <div className="flex flex-col gap-1">
              <span className="font-medium">{formatTime(message.createdAt)}</span>
              <span className="text-xs opacity-80">{getMessagePreview(message)}</span>
            </div>
          }
          placement="left"
          mouseEnterDelay={0.1}
        >
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-200',
              'hover:scale-150 hover:shadow-lg'
            )}
            style={{ backgroundColor: getDotColor(message) }}
            onClick={() => handleDotClick(message.id)}
          />
        </Tooltip>
      ),
      color: getDotColor(message),
      children: null,
    }));
  }, [validMessages, formatTime, getMessagePreview, getDotColor, handleDotClick]);

  if (isImmersiveMode || validMessages.length === 0) {
    return null;
  }

  const sliderTrackColor = isDarkMode ? '#525252' : '#e5e5e5';
  const sliderHandleColor = isDarkMode ? '#d4d4d4' : '#525252';
  const sliderRailColor = isDarkMode ? '#262626' : '#f5f5f5';

  return (
    <ConfigProvider
      theme={{
        components: {
          Timeline: {
            dotBg: 'transparent',
            lineColor: isDarkMode ? '#404040' : '#e5e5e5',
            tailColor: isDarkMode ? '#404040' : '#e5e5e5',
          },
          Slider: {
            trackBg: sliderTrackColor,
            railBg: sliderRailColor,
            handleColor: sliderHandleColor,
            handleActiveColor: sliderHandleColor,
            handleSize: 16,
            handleLineWidth: 0,
            trackHoverBg: sliderTrackColor,
          },
        },
        token: {
          colorTextSecondary: isDarkMode ? '#a3a3a3' : '#737373',
        },
      }}
    >
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 flex flex-col items-center justify-between py-3 z-10',
          'transition-opacity duration-300',
          isDragging ? 'opacity-100' : 'opacity-60 hover:opacity-100'
        )}
        style={{ width: '48px' }}
      >
        <div className={cn(
          'text-[10px] font-medium mb-2',
          isDarkMode ? 'text-[#a3a3a3]' : 'text-[#737373]'
        )}>最早</div>

        <div className="flex-1 flex items-center gap-2 my-1">
          <div className="flex-1 overflow-hidden py-2">
            <AntTimeline
              items={timelineItems}
              mode="left"
              className="h-full"
              style={{
                padding: 0,
                margin: 0,
              }}
            />
          </div>

          <div className="w-4 h-full flex flex-col py-2">
            <Slider
              vertical
              value={sliderValue}
              onChange={handleSliderChange}
              onChangeComplete={handleSliderAfterChange}
              onMouseDown={() => setIsDragging(true)}
              max={100}
              min={0}
              step={0.1}
              tooltip={{ open: false }}
              className="h-full"
              styles={{
                track: {
                  backgroundColor: 'transparent',
                },
                rail: {
                  width: '2px',
                  borderRadius: '1px',
                },
                handle: {
                  width: '12px',
                  height: '12px',
                  marginLeft: '-5px',
                  marginTop: '-6px',
                  border: `2px solid ${isDarkMode ? '#262626' : '#ffffff'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              }}
            />
          </div>
        </div>

        <div className={cn(
          'text-[10px] font-medium mt-2',
          isDarkMode ? 'text-[#a3a3a3]' : 'text-[#737373]'
        )}>最新</div>
      </div>
    </ConfigProvider>
  );
}
