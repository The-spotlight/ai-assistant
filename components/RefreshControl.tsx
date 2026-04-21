'use client';

import { useCallback } from 'react';
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

function IconSettings(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
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

  const handleIntervalChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value) as RefreshIntervalValue;
      setRefreshInterval(value);
    },
    [setRefreshInterval]
  );

  const handleRefresh = useCallback(() => {
    void triggerRefresh();
  }, [triggerRefresh]);

  const isDisabled = isRefreshing || isLoading;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isDisabled}
        title={isRefreshing ? '正在刷新...' : '手动刷新'}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <IconRefresh className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{isRefreshing ? '刷新中…' : '刷新'}</span>
      </button>

      <div className="flex items-center gap-1.5">
        <IconSettings className="h-3.5 w-3.5 text-[#a3a3a3]" />
        <select
          value={refreshInterval}
          onChange={handleIntervalChange}
          disabled={isLoading}
          className="appearance-none rounded-lg bg-transparent px-2 py-1.5 text-xs text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717] disabled:opacity-40 focus:outline-none cursor-pointer transition-colors"
          title="自动刷新频率"
        >
          {REFRESH_INTERVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {lastRefreshTime && !isRefreshing && (
        <span className="hidden sm:inline text-[10px] text-[#a3a3a3]" title={`上次刷新: ${lastRefreshTime.toLocaleString('zh-CN')}`}>
          {formatLastRefresh(lastRefreshTime)}
        </span>
      )}
    </div>
  );
}
