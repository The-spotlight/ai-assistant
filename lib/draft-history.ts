const DRAFT_KEY_PREFIX = 'chat_draft_';
const HISTORY_KEY_PREFIX = 'chat_history_';
const MAX_HISTORY_SIZE = 20;

export function saveDraft(conversationId: string, content: string): void {
  try {
    const key = `${DRAFT_KEY_PREFIX}${conversationId}`;
    localStorage.setItem(key, content);
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
}

export function loadDraft(conversationId: string): string {
  try {
    const key = `${DRAFT_KEY_PREFIX}${conversationId}`;
    return localStorage.getItem(key) || '';
  } catch (e) {
    console.error('Failed to load draft:', e);
    return '';
  }
}

export function clearDraft(conversationId: string): void {
  try {
    const key = `${DRAFT_KEY_PREFIX}${conversationId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear draft:', e);
  }
}

export function addToHistory(conversationId: string, content: string): void {
  try {
    const key = `${HISTORY_KEY_PREFIX}${conversationId}`;
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    
    const filtered = history.filter((item: string) => item !== content);
    
    filtered.unshift(content);
    
    const trimmed = filtered.slice(0, MAX_HISTORY_SIZE);
    
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to add to history:', e);
  }
}

export function getHistory(conversationId: string): string[] {
  try {
    const key = `${HISTORY_KEY_PREFIX}${conversationId}`;
    const existing = localStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error('Failed to get history:', e);
    return [];
  }
}