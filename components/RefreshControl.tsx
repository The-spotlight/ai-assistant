'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAutoRefresh,
  REFRESH_INTERVAL_OPTIONS,
  type RefreshIntervalValue,
} from '@/lib/auto-refresh';

function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

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

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatLastRefresh(time: Date | null): string {
  if (!time) return '';
  const diff = Date.now() - time.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return '刚刚';
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function getIntervalLabel(value: RefreshIntervalValue): string {
  const option = REFRESH_INTERVAL_OPTIONS.find((opt) => opt.value === value);
  return option?.label || '关闭自动刷新';
}

type RefreshControlProps = {
  isLoading?: boolean;
  onRefresh: () => unknown;
  className?: string;
};

export default function RefreshControl({ isLoading = false, onRefresh, className = '' }: RefreshControlProps) {
  const { refreshInterval, setRefreshInterval, isRefreshing, lastRefreshTime, triggerRefresh } = useAutoRefresh({
    enabled: true,
    isLoading,
    onRefresh,
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAutoRefreshEnabled = refreshInterval > 0;
  const currentLabel = getIntervalLabel(refreshInterval);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectInterval = useCallback(
    (value: RefreshIntervalValue) => {
      setRefreshInterval(value);
      setShowDropdown(false);
    },
    [setRefreshInterval]
  );

  const handleRefresh = useCallback(() => {
    void triggerRefresh();
  }, [triggerRefresh]);

  const toggleDropdown = useCallback(() => {
    if (!isLoading) {
      setShowDropdown((prev) => !prev);
    }
  }, [isLoading]);

  const isDisabled = isRefreshing || isLoading;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isDisabled}
        title={isRefreshing ? '正在刷新...' : isAutoRefreshEnabled ? `自动刷新已开启 (${currentLabel}) - 点击手动刷新` : '点击手动刷新'}
        className={`group relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
          isAutoRefreshEnabled
            ? 'bg-[#e0f2fe] text-[#0369a1] hover:bg-[#bae6fd] shadow-sm'
            : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
        }`}
      >
        {isAutoRefreshEnabled && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0ea5e9] opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0ea5e9]"></span>
          </span>
        )}
        <IconRefresh className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline font-medium">{isRefreshing ? '刷新中…' : '刷新'}</span>
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={isLoading}
          title={`当前: ${currentLabel} - 点击修改刷新频率`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            isAutoRefreshEnabled
              ? 'bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7] shadow-sm'
              : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
          }`}
        >
          <IconClock className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-medium">{currentLabel}</span>
          <IconChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white py-1 shadow-lg">
            {REFRESH_INTERVAL_OPTIONS.map((opt) => {
              const isSelected = refreshInterval === opt.value;
              const isEnabled = opt.value > 0;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectInterval(opt.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#f5f5f5] text-[#171717]'
                      : 'text-[#737373] hover:bg-[#fafafa] hover:text-[#171717]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        isSelected ? 'bg-[#171717] text-white' : 'bg-[#e5e5e5]'
                      }`}
                    >
                      {isSelected && <IconCheck className="h-3 w-3" />}
                    </span>
                    <span className="font-medium">{opt.label}</span>
                  </div>
                  {isEnabled && (
                    <span className="text-[10px] text-[#a3a3a3]">自动</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lastRefreshTime && !isRefreshing && (
        <span
          className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#a3a3a3]"
          title={`上次刷新: ${lastRefreshTime.toLocaleString('zh-CN')}`}
        >
          <span className="h-1 w-1 rounded-full bg-[#d4d4d4]"></span>
          {formatLastRefresh(lastRefreshTime)}
        </span>
      )}
    </div>
  );
}
