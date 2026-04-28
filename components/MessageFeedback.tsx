'use client';

import { useState, useCallback, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export interface FeedbackState {
  liked: boolean;
  disliked: boolean;
  reason?: string;
  comment?: string;
}

export interface MessageFeedbackProps {
  messageId: string;
  conversationId: string;
  deviceId: string;
}

export function useMessageFeedback(deviceId: string) {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackState>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadFeedback = useCallback(async () => {
    if (!deviceId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/message-feedback', {
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (response.ok) {
        const feedbacks = await response.json();
        const map: Record<string, FeedbackState> = {};

        feedbacks.forEach((feedback: any) => {
          map[feedback.messageId] = {
            liked: feedback.liked,
            disliked: feedback.disliked,
            reason: feedback.reason,
            comment: feedback.comment,
          };
        });

        setFeedbackMap(map);
      }
    } catch (error) {
      console.error('Error loading message feedback:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  const sendFeedback = useCallback(async (
    messageId: string,
    conversationId: string,
    feedback: FeedbackState
  ) => {
    try {
      const response = await fetch('/api/message-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          messageId,
          conversationId,
          deviceId,
          ...feedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send feedback');
      }

      return true;
    } catch (error) {
      console.error('Error sending feedback:', error);
      return false;
    }
  }, [deviceId]);

  const handleLike = useCallback(async (messageId: string, conversationId: string) => {
    const current = feedbackMap[messageId] || { liked: false, disliked: false };
    const newFeedback: FeedbackState = {
      ...current,
      liked: !current.liked,
      disliked: false,
      reason: undefined,
      comment: undefined,
    };

    setFeedbackMap(prev => ({
      ...prev,
      [messageId]: newFeedback,
    }));

    const success = await sendFeedback(messageId, conversationId, newFeedback);
    if (!success) {
      setFeedbackMap(prev => ({
        ...prev,
        [messageId]: current,
      }));
    }
  }, [feedbackMap, sendFeedback]);

  const handleDislike = useCallback(async (
    messageId: string,
    conversationId: string,
    reason: string,
    comment: string
  ) => {
    const current = feedbackMap[messageId] || { liked: false, disliked: false };
    const newFeedback: FeedbackState = {
      liked: false,
      disliked: true,
      reason,
      comment,
    };

    setFeedbackMap(prev => ({
      ...prev,
      [messageId]: newFeedback,
    }));

    const success = await sendFeedback(messageId, conversationId, newFeedback);
    if (!success) {
      setFeedbackMap(prev => ({
        ...prev,
        [messageId]: current,
      }));
    }
  }, [feedbackMap, sendFeedback]);

  const handleUndoDislike = useCallback(async (messageId: string, conversationId: string) => {
    const current = feedbackMap[messageId] || { liked: false, disliked: false };
    const newFeedback: FeedbackState = {
      ...current,
      disliked: false,
      reason: undefined,
      comment: undefined,
    };

    setFeedbackMap(prev => ({
      ...prev,
      [messageId]: newFeedback,
    }));

    const success = await sendFeedback(messageId, conversationId, newFeedback);
    if (!success) {
      setFeedbackMap(prev => ({
        ...prev,
        [messageId]: current,
      }));
    }
  }, [feedbackMap, sendFeedback]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return {
    feedbackMap,
    isLoading,
    handleLike,
    handleDislike,
    handleUndoDislike,
    reloadFeedback: loadFeedback,
  };
}

export interface MessageFeedbackButtonProps {
  messageId: string;
  conversationId: string;
  deviceId: string;
  feedback: FeedbackState;
  onLike: (messageId: string, conversationId: string) => void;
  onDislike: (messageId: string, conversationId: string, reason: string, comment: string) => void;
  onUndoDislike: (messageId: string, conversationId: string) => void;
}

export function MessageFeedbackButton({
  messageId,
  conversationId,
  feedback,
  onLike,
  onDislike,
  onUndoDislike,
}: MessageFeedbackButtonProps) {
  const [showDislikeModal, setShowDislikeModal] = useState(false);
  const [dislikeReason, setDislikeReason] = useState('');
  const [dislikeComment, setDislikeComment] = useState('');

  const handleDislikeClick = () => {
    if (feedback.disliked) {
      onUndoDislike(messageId, conversationId);
    } else {
      setShowDislikeModal(true);
    }
  };

  const handleDislikeSubmit = () => {
    onDislike(messageId, conversationId, dislikeReason, dislikeComment);
    setShowDislikeModal(false);
    setDislikeReason('');
    setDislikeComment('');
  };

  const handleCancelDislike = () => {
    setShowDislikeModal(false);
    setDislikeReason('');
    setDislikeComment('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => onLike(messageId, conversationId)}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors hover:bg-[#f5f5f5] ${
          feedback.liked
            ? 'text-[#10b981]'
            : 'text-[#737373] hover:text-[#171717]'
        }`}
        title={feedback.liked ? '取消点赞' : '点赞此回复'}
      >
        <ThumbsUp className={`h-3 w-3 ${feedback.liked ? 'fill-[#10b981]' : ''}`} />
        {feedback.liked ? '已点赞' : '点赞'}
      </button>

      <button
        type="button"
        onClick={handleDislikeClick}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors hover:bg-[#f5f5f5] ${
          feedback.disliked
            ? 'text-[#ef4444]'
            : 'text-[#737373] hover:text-[#171717]'
        }`}
        title={feedback.disliked ? '取消点踩' : '点踩此回复'}
      >
        <ThumbsDown className={`h-3 w-3 ${feedback.disliked ? 'fill-[#ef4444]' : ''}`} />
        {feedback.disliked ? '已点踩' : '点踩'}
      </button>

      {showDislikeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="mx-4 w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.06] bg-[#fafafa]">
              <span className="text-sm font-medium text-[#171717]">点踩原因</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  选择原因
                </label>
                <select
                  value={dislikeReason}
                  onChange={(e) => setDislikeReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
                >
                  <option value="">请选择原因</option>
                  <option value="inaccurate">回答不准确</option>
                  <option value="unhelpful">回答没有帮助</option>
                  <option value="offensive">内容不当</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  详细说明（选填）
                </label>
                <textarea
                  value={dislikeComment}
                  onChange={(e) => setDislikeComment(e.target.value)}
                  placeholder="请描述您的问题..."
                  className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelDislike}
                  className="flex-1 px-4 py-2 text-sm font-medium text-[#525252] bg-[#f5f5f5] rounded-lg hover:bg-[#e5e5e5] transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDislikeSubmit}
                  disabled={!dislikeReason}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#ef4444] rounded-lg hover:bg-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认点踩
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}