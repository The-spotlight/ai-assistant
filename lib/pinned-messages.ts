'use client';

const PINNED_MESSAGES_STORAGE_KEY = 'ai-assistant-pinned-messages';

export interface PinnedMessage {
  messageId: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  pinnedAt: string;
}

export function loadPinnedMessages(): Record<string, PinnedMessage[]> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(PINNED_MESSAGES_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, any>;
    const pinned: Record<string, PinnedMessage[]> = {};

    for (const [conversationId, messages] of Object.entries(parsed)) {
      if (Array.isArray(messages)) {
        const validMessages: PinnedMessage[] = [];
        for (const msg of messages) {
          if (validatePinnedMessage(msg)) {
            validMessages.push(msg);
          }
        }
        if (validMessages.length > 0) {
          pinned[conversationId] = validMessages;
        }
      }
    }

    return pinned;
  } catch {
    return {};
  }
}

export function savePinnedMessages(pinned: Record<string, PinnedMessage[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PINNED_MESSAGES_STORAGE_KEY, JSON.stringify(pinned));
  } catch {
    console.warn('Failed to save pinned messages');
  }
}

export function validatePinnedMessage(data: unknown): data is PinnedMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as any;

  if (typeof d.messageId !== 'string' || !d.messageId) return false;
  if (typeof d.conversationId !== 'string' || !d.conversationId) return false;
  if (typeof d.content !== 'string') return false;
  if (d.role !== 'user' && d.role !== 'assistant') return false;
  if (typeof d.createdAt !== 'string' || !d.createdAt) return false;
  if (typeof d.pinnedAt !== 'string' || !d.pinnedAt) return false;

  return true;
}

export function getPinnedMessages(conversationId: string): PinnedMessage[] {
  const pinned = loadPinnedMessages();
  return pinned[conversationId] || [];
}

export function isMessagePinned(conversationId: string, messageId: string): boolean {
  const messages = getPinnedMessages(conversationId);
  return messages.some(m => m.messageId === messageId);
}

export function togglePinMessage(
  conversationId: string,
  message: { id: string; content: string; role: 'user' | 'assistant'; createdAt?: string }
): boolean {
  const pinned = loadPinnedMessages();
  const conversationMessages = pinned[conversationId] || [];
  const existingIndex = conversationMessages.findIndex(m => m.messageId === message.id);

  if (existingIndex >= 0) {
    conversationMessages.splice(existingIndex, 1);
    if (conversationMessages.length === 0) {
      delete pinned[conversationId];
    } else {
      pinned[conversationId] = conversationMessages;
    }
    savePinnedMessages(pinned);
    return false;
  } else {
    const pinnedMessage: PinnedMessage = {
      messageId: message.id,
      conversationId,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt || new Date().toISOString(),
      pinnedAt: new Date().toISOString(),
    };
    pinned[conversationId] = [pinnedMessage, ...conversationMessages];
    savePinnedMessages(pinned);
    return true;
  }
}

export function clearPinnedMessages(conversationId: string): void {
  const pinned = loadPinnedMessages();
  delete pinned[conversationId];
  savePinnedMessages(pinned);
}
