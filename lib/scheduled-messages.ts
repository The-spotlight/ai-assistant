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

type ReplyToInfo = {
  messageId: string;
  content: string;
  createdAt: string;
  role: string;
};

export async function fetchScheduledMessages(conversationId?: string): Promise<ScheduledMessage[]> {
  try {
    const url = conversationId 
      ? `/api/scheduled-messages?conversationId=${encodeURIComponent(conversationId)}`
      : '/api/scheduled-messages';
    
    const response = await fetch(url, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch scheduled messages: ${response.status}`);
    }
    
    const data = await response.json();
    return data.scheduledMessages || [];
  } catch (e) {
    console.error('Failed to fetch scheduled messages:', e);
    return [];
  }
}

export async function createScheduledMessage(
  conversationId: string,
  content: string,
  scheduledAt: Date,
  replyTo?: ReplyToInfo | null
): Promise<ScheduledMessage | null> {
  try {
    const response = await fetch('/api/scheduled-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        conversationId,
        content: content.trim(),
        scheduledAt: scheduledAt.toISOString(),
        replyTo,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '创建定时消息失败' }));
      throw new Error(error.error || '创建定时消息失败');
    }
    
    const data = await response.json();
    return data.scheduledMessage;
  } catch (e) {
    console.error('Failed to create scheduled message:', e);
    return null;
  }
}

export async function cancelScheduledMessage(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/scheduled-messages/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    return response.ok;
  } catch (e) {
    console.error('Failed to cancel scheduled message:', e);
    return false;
  }
}

export async function updateScheduledMessage(
  id: string,
  updates: { scheduledAt?: Date }
): Promise<ScheduledMessage | null> {
  try {
    const body: Record<string, string> = {};
    if (updates.scheduledAt) {
      body.scheduledAt = updates.scheduledAt.toISOString();
    }
    
    const response = await fetch(`/api/scheduled-messages/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update scheduled message');
    }
    
    const data = await response.json();
    return data.scheduledMessage;
  } catch (e) {
    console.error('Failed to update scheduled message:', e);
    return null;
  }
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

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export async function getScheduledConversationIds(): Promise<Set<string>> {
  const messages = await fetchScheduledMessages();
  const conversationIds = new Set<string>();
  messages.forEach((msg) => conversationIds.add(msg.conversationId));
  return conversationIds;
}
