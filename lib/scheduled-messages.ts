import type { Message } from 'ai';

export interface ScheduledMessage {
  id: string;
  conversationId: string;
  content: string;
  scheduledAt: string;
  createdAt: string;
  status: 'pending' | 'sent' | 'cancelled';
  replyToId?: string | null;
  replyToSnapshot?: string | null;
}

const SCHEDULED_MESSAGES_KEY = 'scheduled_messages';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function getAllScheduledMessages(): ScheduledMessage[] {
  try {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SCHEDULED_MESSAGES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to get scheduled messages:', e);
    return [];
  }
}

export function getScheduledMessages(conversationId: string): ScheduledMessage[] {
  return getAllScheduledMessages().filter(
    (msg) => msg.conversationId === conversationId && msg.status === 'pending'
  );
}

export function saveScheduledMessage(message: Omit<ScheduledMessage, 'id' | 'createdAt' | 'status'>): ScheduledMessage {
  const allMessages = getAllScheduledMessages();
  const newMessage: ScheduledMessage = {
    ...message,
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  allMessages.push(newMessage);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCHEDULED_MESSAGES_KEY, JSON.stringify(allMessages));
    }
  } catch (e) {
    console.error('Failed to save scheduled message:', e);
  }
  return newMessage;
}

export function updateScheduledMessage(id: string, updates: Partial<ScheduledMessage>): ScheduledMessage | null {
  const allMessages = getAllScheduledMessages();
  const index = allMessages.findIndex((msg) => msg.id === id);
  if (index === -1) return null;
  const updatedMessage = { ...allMessages[index], ...updates };
  allMessages[index] = updatedMessage;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCHEDULED_MESSAGES_KEY, JSON.stringify(allMessages));
    }
  } catch (e) {
    console.error('Failed to update scheduled message:', e);
  }
  return updatedMessage;
}

export function cancelScheduledMessage(id: string): boolean {
  const result = updateScheduledMessage(id, { status: 'cancelled' });
  return result !== null;
}

export function markScheduledMessageAsSent(id: string): boolean {
  const result = updateScheduledMessage(id, { status: 'sent' });
  return result !== null;
}

export function getPendingMessages(): ScheduledMessage[] {
  return getAllScheduledMessages().filter((msg) => msg.status === 'pending');
}

export function hasScheduledMessages(conversationId: string): boolean {
  return getScheduledMessages(conversationId).length > 0;
}

export function formatScheduledTime(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const isDayAfterTomorrow = date.toDateString() === dayAfterTomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) {
    return `今天 ${timeStr}`;
  } else if (isTomorrow) {
    return `明天 ${timeStr}`;
  } else if (isDayAfterTomorrow) {
    return `后天 ${timeStr}`;
  } else {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

let activeTimers: Map<string, NodeJS.Timeout> = new Map();
let scheduledCallback: ((message: ScheduledMessage) => void) | null = null;

export function setScheduledCallback(callback: (message: ScheduledMessage) => void) {
  scheduledCallback = callback;
}

export function scheduleMessageTimer(message: ScheduledMessage) {
  const now = Date.now();
  const scheduledTime = new Date(message.scheduledAt).getTime();
  const delay = scheduledTime - now;

  if (delay <= 0) {
    console.log('[ScheduledMessage] 定时时间已过，立即发送:', message.id);
    if (scheduledCallback) {
      scheduledCallback(message);
    }
    return;
  }

  console.log('[ScheduledMessage] 设置定时器:', message.id, '延迟:', delay, 'ms');

  const existingTimer = activeTimers.get(message.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    console.log('[ScheduledMessage] 定时器触发，发送消息:', message.id);
    if (scheduledCallback) {
      scheduledCallback(message);
    }
    activeTimers.delete(message.id);
  }, delay);

  activeTimers.set(message.id, timer);
}

export function cancelMessageTimer(messageId: string) {
  const timer = activeTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(messageId);
  }
}

export function loadAndSchedulePendingMessages() {
  const pending = getPendingMessages();
  console.log('[ScheduledMessage] 加载待发送消息:', pending.length, '条');
  pending.forEach((msg) => {
    scheduleMessageTimer(msg);
  });
}
