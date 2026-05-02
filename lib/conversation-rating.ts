'use client';

const CONVERSATION_RATINGS_STORAGE_KEY = 'ai-assistant-conversation-ratings';

export interface ConversationRating {
  conversationId: string;
  rating: number;
  updatedAt: string;
}

export function loadConversationRatings(): Record<string, ConversationRating> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(CONVERSATION_RATINGS_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, any>;
    const ratings: Record<string, ConversationRating> = {};

    for (const [conversationId, data] of Object.entries(parsed)) {
      if (validateConversationRating(data)) {
        ratings[conversationId] = data;
      }
    }

    return ratings;
  } catch {
    return {};
  }
}

export function saveConversationRatings(ratings: Record<string, ConversationRating>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONVERSATION_RATINGS_STORAGE_KEY, JSON.stringify(ratings));
  } catch {
    console.warn('Failed to save conversation ratings');
  }
}

export function validateConversationRating(data: unknown): data is ConversationRating {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as any;

  if (typeof d.conversationId !== 'string' || !d.conversationId) return false;
  if (typeof d.rating !== 'number' || d.rating < 1 || d.rating > 5) return false;
  if (typeof d.updatedAt !== 'string' || !d.updatedAt) return false;

  return true;
}

export function getConversationRating(conversationId: string): number | null {
  const ratings = loadConversationRatings();
  const rating = ratings[conversationId];
  return rating ? rating.rating : null;
}

export function setConversationRating(conversationId: string, rating: number): void {
  if (rating < 1 || rating > 5) {
    console.warn('Rating must be between 1 and 5');
    return;
  }

  const ratings = loadConversationRatings();
  ratings[conversationId] = {
    conversationId,
    rating,
    updatedAt: new Date().toISOString(),
  };
  saveConversationRatings(ratings);
}

export function clearConversationRating(conversationId: string): void {
  const ratings = loadConversationRatings();
  delete ratings[conversationId];
  saveConversationRatings(ratings);
}

export function formatRatingStars(rating: number | null): string {
  if (rating === null || rating < 1 || rating > 5) {
    return '';
  }
  const filled = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return filled + empty;
}

export interface UseConversationRatingReturn {
  currentRating: number | null;
  setRating: (rating: number) => void;
  clearRating: () => void;
  formattedStars: string;
}

export function useConversationRating(conversationId: string): UseConversationRatingReturn {
  const loadRating = () => getConversationRating(conversationId);
  const currentRating = loadRating();
  
  const setRating = (rating: number) => {
    setConversationRating(conversationId, rating);
  };
  
  const clearRating = () => {
    clearConversationRating(conversationId);
  };
  
  const formattedStars = formatRatingStars(currentRating);
  
  return {
    currentRating,
    setRating,
    clearRating,
    formattedStars,
  };
}
