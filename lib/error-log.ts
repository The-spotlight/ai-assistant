'use client';

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  source?: string;
  level: 'error' | 'warning' | 'info';
}

const ERROR_LOGS_STORAGE_KEY = 'ai-assistant-error-logs';
const LOG_RETENTION_DAYS = 7;
const MAX_LOGS = 100;

export function generateErrorLogId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function loadErrorLogs(): ErrorLog[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(ERROR_LOGS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ErrorLog[];
    return parsed.filter(validateErrorLog);
  } catch {
    return [];
  }
}

export function saveErrorLogs(logs: ErrorLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ERROR_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    console.warn('Failed to save error logs');
  }
}

export function validateErrorLog(log: unknown): log is ErrorLog {
  if (typeof log !== 'object' || log === null) {
    return false;
  }

  const l = log as any;

  if (typeof l.id !== 'string' || !l.id) return false;
  if (typeof l.timestamp !== 'string' || !l.timestamp) return false;
  if (typeof l.message !== 'string') return false;
  if (typeof l.level !== 'string' || !['error', 'warning', 'info'].includes(l.level)) return false;

  return true;
}

export function addErrorLog(
  message: string,
  level: ErrorLog['level'] = 'error',
  options?: { stack?: string; source?: string }
): void {
  const logs = loadErrorLogs();
  const newLog: ErrorLog = {
    id: generateErrorLogId(),
    timestamp: new Date().toISOString(),
    message,
    level,
    ...(options?.stack && { stack: options.stack }),
    ...(options?.source && { source: options.source }),
  };

  let updated = [newLog, ...logs];

  if (updated.length > MAX_LOGS) {
    updated = updated.slice(0, MAX_LOGS);
  }

  saveErrorLogs(updated);
  cleanupOldErrorLogs();
}

export function getRecentErrorLogs(limit: number = 5): ErrorLog[] {
  const logs = loadErrorLogs();
  cleanupOldErrorLogs();
  return loadErrorLogs().slice(0, limit);
}

export function cleanupOldErrorLogs(): void {
  const logs = loadErrorLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);

  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= cutoffDate;
  });

  if (filteredLogs.length !== logs.length) {
    saveErrorLogs(filteredLogs);
  }
}

export function clearAllErrorLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ERROR_LOGS_STORAGE_KEY);
  } catch {
    console.warn('Failed to clear error logs');
  }
}

export function wrapConsoleError(): void {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message;
      }
      if (typeof arg === 'string') {
        return arg;
      }
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    const error = args.find(arg => arg instanceof Error);

    addErrorLog(message, 'error', {
      stack: error?.stack,
      source: 'console.error',
    });

    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message;
      }
      if (typeof arg === 'string') {
        return arg;
      }
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    addErrorLog(message, 'warning', {
      source: 'console.warn',
    });

    originalWarn.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    addErrorLog(
      event.message || 'Uncaught error',
      'error',
      {
        stack: event.error?.stack,
        source: `window.error: ${event.filename}:${event.lineno}:${event.colno}`,
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    let message = 'Unhandled promise rejection';
    let stack: string | undefined;

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    }

    addErrorLog(message, 'error', {
      stack,
      source: 'window.unhandledrejection',
    });
  });
}
