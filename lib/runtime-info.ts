'use client';

const RUNTIME_START_KEY = 'ai-assistant-runtime-start';

export function getOrSetRuntimeStart(): number {
  if (typeof window === 'undefined') return Date.now();

  try {
    let startTime = localStorage.getItem(RUNTIME_START_KEY);
    if (!startTime) {
      const now = Date.now();
      localStorage.setItem(RUNTIME_START_KEY, now.toString());
      return now;
    }
    return parseInt(startTime, 10);
  } catch {
    return Date.now();
  }
}

export function getRuntimeDuration(): number {
  const startTime = getOrSetRuntimeStart();
  return Date.now() - startTime;
}

export function formatRuntimeDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟 ${seconds % 60}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分钟 ${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

export function resetRuntimeStart(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RUNTIME_START_KEY);
  } catch {
    // ignore
  }
}
