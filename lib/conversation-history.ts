const CONVERSATION_HISTORY_KEY = 'ai_assistant_conversation_history';
const MAX_HISTORY_SIZE = 50;
export const CONVERSATION_HISTORY_CHANGED_EVENT = 'ai-assistant-conversation-history-changed';

export interface ConversationHistoryItem {
  conversationId: string;
  visitedAt: string;
  visitCount: number;
}

function dispatchHistoryChangedEvent(): void {
  try {
    const event = new CustomEvent(CONVERSATION_HISTORY_CHANGED_EVENT);
    window.dispatchEvent(event);
  } catch (e) {
    console.error('Failed to dispatch history changed event:', e);
  }
}

export function getConversationHistory(): ConversationHistoryItem[] {
  try {
    const existing = localStorage.getItem(CONVERSATION_HISTORY_KEY);
    if (!existing) return [];
    return JSON.parse(existing);
  } catch (e) {
    console.error('Failed to get conversation history:', e);
    return [];
  }
}

export function recordConversationVisit(conversationId: string): void {
  try {
    const history = getConversationHistory();
    
    const existingIndex = history.findIndex(item => item.conversationId === conversationId);
    
    if (existingIndex >= 0) {
      history[existingIndex] = {
        ...history[existingIndex],
        visitedAt: new Date().toISOString(),
        visitCount: history[existingIndex].visitCount + 1,
      };
    } else {
      history.unshift({
        conversationId,
        visitedAt: new Date().toISOString(),
        visitCount: 1,
      });
    }
    
    const trimmed = history.slice(0, MAX_HISTORY_SIZE);
    
    localStorage.setItem(CONVERSATION_HISTORY_KEY, JSON.stringify(trimmed));
    dispatchHistoryChangedEvent();
  } catch (e) {
    console.error('Failed to record conversation visit:', e);
  }
}

export function getRecentConversations(limit: number = 5): ConversationHistoryItem[] {
  const history = getConversationHistory();
  return history
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
    .slice(0, limit);
}

export function getFrequentConversations(limit: number = 5): ConversationHistoryItem[] {
  const history = getConversationHistory();
  return history
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, limit);
}

export function removeConversationFromHistory(conversationId: string): void {
  try {
    const history = getConversationHistory();
    const filtered = history.filter(item => item.conversationId !== conversationId);
    localStorage.setItem(CONVERSATION_HISTORY_KEY, JSON.stringify(filtered));
    dispatchHistoryChangedEvent();
  } catch (e) {
    console.error('Failed to remove conversation from history:', e);
  }
}

export function clearConversationHistory(): void {
  try {
    localStorage.removeItem(CONVERSATION_HISTORY_KEY);
    dispatchHistoryChangedEvent();
  } catch (e) {
    console.error('Failed to clear conversation history:', e);
  }
}
