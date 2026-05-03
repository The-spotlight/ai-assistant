'use client';

const SENTIMENT_ANALYSIS_STORAGE_KEY = 'ai-assistant-sentiment-analysis';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface MessageSentiment {
  messageId: string;
  sentiment: SentimentType;
  score: number;
  confidence: number;
}

export interface ConversationSentiment {
  conversationId: string;
  analyzedAt: string;
  messageSentiments: MessageSentiment[];
  summary: {
    totalMessages: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  };
}

export function loadSentimentAnalyses(): Record<string, ConversationSentiment> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(SENTIMENT_ANALYSIS_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, any>;
    const analyses: Record<string, ConversationSentiment> = {};

    for (const [conversationId, data] of Object.entries(parsed)) {
      if (validateConversationSentiment(data)) {
        analyses[conversationId] = data;
      }
    }

    return analyses;
  } catch {
    return {};
  }
}

export function saveSentimentAnalyses(analyses: Record<string, ConversationSentiment>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SENTIMENT_ANALYSIS_STORAGE_KEY, JSON.stringify(analyses));
  } catch {
    console.warn('Failed to save sentiment analyses');
  }
}

export function validateMessageSentiment(data: unknown): data is MessageSentiment {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as any;

  if (typeof d.messageId !== 'string' || !d.messageId) return false;
  if (typeof d.sentiment !== 'string' || !['positive', 'neutral', 'negative'].includes(d.sentiment)) return false;
  if (typeof d.score !== 'number' || d.score < -1 || d.score > 1) return false;
  if (typeof d.confidence !== 'number' || d.confidence < 0 || d.confidence > 1) return false;

  return true;
}

export function validateConversationSentiment(data: unknown): data is ConversationSentiment {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as any;

  if (typeof d.conversationId !== 'string' || !d.conversationId) return false;
  if (typeof d.analyzedAt !== 'string' || !d.analyzedAt) return false;
  if (!Array.isArray(d.messageSentiments)) return false;
  if (!d.messageSentiments.every((item: unknown) => validateMessageSentiment(item))) return false;
  if (typeof d.summary !== 'object' || d.summary === null) return false;

  const summary = d.summary;
  if (typeof summary.totalMessages !== 'number') return false;
  if (typeof summary.positiveCount !== 'number') return false;
  if (typeof summary.neutralCount !== 'number') return false;
  if (typeof summary.negativeCount !== 'number') return false;

  return true;
}

export function getConversationSentiment(conversationId: string): ConversationSentiment | null {
  const analyses = loadSentimentAnalyses();
  return analyses[conversationId] || null;
}

export function saveConversationSentiment(
  conversationId: string,
  messageSentiments: MessageSentiment[]
): ConversationSentiment {
  const analyses = loadSentimentAnalyses();
  
  const totalMessages = messageSentiments.length;
  const positiveCount = messageSentiments.filter(m => m.sentiment === 'positive').length;
  const neutralCount = messageSentiments.filter(m => m.sentiment === 'neutral').length;
  const negativeCount = messageSentiments.filter(m => m.sentiment === 'negative').length;

  const analysis: ConversationSentiment = {
    conversationId,
    analyzedAt: new Date().toISOString(),
    messageSentiments,
    summary: {
      totalMessages,
      positiveCount,
      neutralCount,
      negativeCount,
      positivePercentage: totalMessages > 0 ? (positiveCount / totalMessages) * 100 : 0,
      neutralPercentage: totalMessages > 0 ? (neutralCount / totalMessages) * 100 : 0,
      negativePercentage: totalMessages > 0 ? (negativeCount / totalMessages) * 100 : 0,
    },
  };

  analyses[conversationId] = analysis;
  saveSentimentAnalyses(analyses);

  return analysis;
}

export function clearConversationSentiment(conversationId: string): void {
  const analyses = loadSentimentAnalyses();
  delete analyses[conversationId];
  saveSentimentAnalyses(analyses);
}

export function getMessageSentiment(
  conversationId: string,
  messageId: string
): MessageSentiment | null {
  const analysis = getConversationSentiment(conversationId);
  if (!analysis) return null;
  return analysis.messageSentiments.find(m => m.messageId === messageId) || null;
}

export function getSentimentColor(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'positive':
      return '#22c55e';
    case 'neutral':
      return '#a3a3a3';
    case 'negative':
      return '#ef4444';
  }
}

export function getSentimentLabel(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'positive':
      return '积极';
    case 'neutral':
      return '中性';
    case 'negative':
      return '消极';
  }
}
