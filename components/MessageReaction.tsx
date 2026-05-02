'use client';

import { useState, useCallback, useEffect } from 'react';

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;

export interface Reaction {
  emoji: string;
  count: number;
  isMine: boolean;
}

export interface MessageReactionMap {
  [messageId: string]: {
    reactions: Reaction[];
    myReaction?: string;
  };
}

export function useMessageReaction(deviceId: string, conversationId: string) {
  const [reactionMap, setReactionMap] = useState<MessageReactionMap>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadReactions = useCallback(async () => {
    if (!deviceId || !conversationId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/message-reactions?conversationId=${encodeURIComponent(conversationId)}`, {
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newMap: MessageReactionMap = {};
        
        Object.entries(data).forEach(([messageId, value]: [string, any]) => {
          newMap[messageId] = {
            reactions: [],
            myReaction: value.emoji,
          };
        });

        setReactionMap(newMap);
      }
    } catch (error) {
      console.error('Error loading message reactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, conversationId]);

  const loadMessageReactions = useCallback(async (messageId: string) => {
    if (!deviceId || !messageId) return;

    try {
      const response = await fetch(`/api/message-reactions?messageId=${encodeURIComponent(messageId)}`, {
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (response.ok) {
        const reactions: Reaction[] = await response.json();
        const myReaction = reactions.find(r => r.isMine)?.emoji;

        setReactionMap(prev => ({
          ...prev,
          [messageId]: {
            reactions,
            myReaction,
          },
        }));
      }
    } catch (error) {
      console.error('Error loading message reactions:', error);
    }
  }, [deviceId]);

  const sendReaction = useCallback(async (
    messageId: string,
    emoji: string
  ) => {
    if (!messageId || !conversationId || !deviceId) {
      console.error('Cannot react: missing required parameters');
      return null;
    }

    const current = reactionMap[messageId] || { reactions: [], myReaction: undefined };
    const isRemoving = current.myReaction === emoji;

    let newReactions = [...current.reactions];
    let newMyReaction: string | undefined = emoji;

    if (isRemoving) {
      newMyReaction = undefined;
      newReactions = newReactions.map(r => {
        if (r.emoji === emoji) {
          return { ...r, count: r.count - 1, isMine: false };
        }
        return r;
      }).filter(r => r.count > 0);
    } else if (current.myReaction) {
      newReactions = newReactions.map(r => {
        if (r.emoji === current.myReaction) {
          return { ...r, count: r.count - 1, isMine: false };
        }
        if (r.emoji === emoji) {
          return { ...r, count: r.count + 1, isMine: true };
        }
        return r;
      }).filter(r => r.count > 0);

      const existingEmoji = newReactions.find(r => r.emoji === emoji);
      if (!existingEmoji) {
        newReactions.push({ emoji, count: 1, isMine: true });
      }
    } else {
      const existingEmoji = newReactions.find(r => r.emoji === emoji);
      if (existingEmoji) {
        newReactions = newReactions.map(r => 
          r.emoji === emoji ? { ...r, count: r.count + 1, isMine: true } : r
        );
      } else {
        newReactions.push({ emoji, count: 1, isMine: true });
      }
    }

    setReactionMap(prev => ({
      ...prev,
      [messageId]: {
        reactions: newReactions,
        myReaction: newMyReaction,
      },
    }));

    try {
      const response = await fetch('/api/message-reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          messageId,
          conversationId,
          deviceId,
          emoji,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reaction');
      }

      const result = await response.json();
      await loadMessageReactions(messageId);
      return result;
    } catch (error) {
      console.error('Error sending reaction:', error);
      setReactionMap(prev => ({
        ...prev,
        [messageId]: current,
      }));
      return null;
    }
  }, [deviceId, conversationId, reactionMap, loadMessageReactions]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  return {
    reactionMap,
    isLoading,
    sendReaction,
    loadMessageReactions,
    reloadReactions: loadReactions,
  };
}

interface ReactionBarProps {
  messageId: string;
  reactions: Reaction[];
  myReaction?: string;
  onReaction: (emoji: string) => void;
  visible: boolean;
}

export function MessageReactionBar({
  messageId,
  reactions,
  myReaction,
  onReaction,
  visible,
}: ReactionBarProps) {
  const reactionsByEmoji: Record<string, Reaction> = {};
  reactions.forEach(r => {
    reactionsByEmoji[r.emoji] = r;
  });

  if (!visible) return null;

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-[#262626] rounded-lg shadow-lg border border-black/[0.08] dark:border-white/10 px-1.5 py-1">
      {QUICK_REACTIONS.map((emoji) => {
        const reaction = reactionsByEmoji[emoji];
        const isActive = myReaction === emoji;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReaction(emoji)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-[#f5f5f5] dark:bg-[#3d3d3d]'
                : 'hover:bg-[#f5f5f5] dark:hover:bg-[#3d3d3d]'
            }`}
            title={reaction ? `${emoji} (${reaction.count})` : emoji}
          >
            <span>{emoji}</span>
            {reaction && reaction.count > 0 && (
              <span className={`text-[10px] ${isActive ? 'text-[#171717] dark:text-white font-medium' : 'text-[#737373] dark:text-[#a3a3a3]'}`}>
                {reaction.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface ReactionDisplayProps {
  reactions: Reaction[];
  onReaction: (emoji: string) => void;
}

export function MessageReactionDisplay({
  reactions,
  onReaction,
}: ReactionDisplayProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onReaction(reaction.emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
            reaction.isMine
              ? 'bg-[#e5e5e5] dark:bg-[#404040]'
              : 'bg-[#f5f5f5] dark:bg-[#3d3d3d] hover:bg-[#e5e5e5] dark:hover:bg-[#404040]'
          }`}
          title={reaction.isMine ? '点击取消' : '点击回应'}
        >
          <span>{reaction.emoji}</span>
          <span className={`${reaction.isMine ? 'text-[#171717] dark:text-white font-medium' : 'text-[#737373] dark:text-[#a3a3a3]'}`}>
            {reaction.count}
          </span>
        </button>
      ))}
    </div>
  );
}
