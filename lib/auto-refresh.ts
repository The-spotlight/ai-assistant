'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export const REFRESH_INTERVAL_OPTIONS = [
  { value: 0, label: '关闭自动刷新' },
  { value: 5000, label: '5 秒' },
  { value: 10000, label: '10 秒' },
  { value: 30000, label: '30 秒' },
  { value: 60000, label: '1 分钟' },
  { value: 300000, label: '5 分钟' },
] as const;

export type RefreshIntervalValue = (typeof REFRESH_INTERVAL_OPTIONS)[number]['value'];

const REFRESH_INTERVAL_STORAGE_KEY = 'ai-assistant-refresh-interval';

export function getStoredRefreshInterval(): RefreshIntervalValue {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY);
    if (stored != null) {
      const parsed = Number(stored);
      const validValues = REFRESH_INTERVAL_OPTIONS.map((o) => o.value);
      if (validValues.includes(parsed as RefreshIntervalValue)) {
        return parsed as RefreshIntervalValue;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

export function setStoredRefreshInterval(interval: RefreshIntervalValue): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(interval));
  } catch {
    // ignore
  }
}

type UseAutoRefreshOptions = {
  enabled?: boolean;
  isLoading?: boolean;
  onRefresh: () => unknown;
};

export function useAutoRefresh({ enabled = true, isLoading = false, onRefresh }: UseAutoRefreshOptions) {
  const [refreshInterval, setRefreshIntervalState] = useState<RefreshIntervalValue>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const stored = getStoredRefreshInterval();
    setRefreshIntervalState(stored);
    isInitialized.current = true;
  }, []);

  const setRefreshInterval = useCallback((interval: RefreshIntervalValue) => {
    setRefreshIntervalState(interval);
    setStoredRefreshInterval(interval);
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing || isLoading) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshTime(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isLoading, onRefresh]);

  useEffect(() => {
    if (!enabled || refreshInterval <= 0 || !isInitialized.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!isRefreshing && !isLoading) {
        void triggerRefresh();
      }
    }, refreshInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [refreshInterval, enabled, isRefreshing, isLoading, triggerRefresh]);

  return {
    refreshInterval,
    setRefreshInterval,
    isRefreshing,
    lastRefreshTime,
    triggerRefresh,
  };
}
