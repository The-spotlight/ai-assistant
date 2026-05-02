'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Star } from 'lucide-react';
import { formatRatingStars } from '@/lib/conversation-rating';

type ConversationRatingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentRating: number | null;
  onSave: (rating: number) => void;
};

const RATING_LABELS = ['很差', '较差', '一般', '较好', '很好'];

export default function ConversationRatingModal({
  isOpen,
  onClose,
  currentRating,
  onSave,
}: ConversationRatingModalProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRating(currentRating);
      setHoverRating(null);
    }
  }, [isOpen, currentRating]);

  const displayRating = hoverRating ?? selectedRating;

  const handleStarClick = useCallback((rating: number) => {
    setSelectedRating(rating);
  }, []);

  const handleStarHover = useCallback((rating: number) => {
    setHoverRating(rating);
  }, []);

  const handleStarLeave = useCallback(() => {
    setHoverRating(null);
  }, []);

  const handleSave = useCallback(() => {
    if (selectedRating !== null) {
      onSave(selectedRating);
    }
    onClose();
  }, [selectedRating, onSave, onClose]);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackgroundClick}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-4 border-b border-black/[0.06]">
          <Button variant="ghost" size="icon" onClick={onClose} title="关闭">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="mb-4 flex justify-center">
            <Star className="h-12 w-12 text-[#f59e0b] fill-[#f59e0b]" />
          </div>

          <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">
            给对话评分
          </h3>
          <p className="mb-6 text-center text-sm text-[#737373]">
            {currentRating !== null
              ? '当前评分：' + formatRatingStars(currentRating) + '，可以重新评分'
              : '您觉得这次对话怎么样？点击星星给对话打分'}
          </p>

          <div className="mb-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleStarClick(rating)}
                  onMouseEnter={() => handleStarHover(rating)}
                  onMouseLeave={handleStarLeave}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  title={`${rating} 星 - ${RATING_LABELS[rating - 1]}`}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      displayRating !== null && rating <= displayRating
                        ? 'text-[#f59e0b] fill-[#f59e0b]'
                        : 'text-[#d4d4d4]'
                    }`}
                  />
                </button>
              ))}
            </div>

            {displayRating !== null && (
              <div className="mt-3 text-center">
                <span className="text-lg font-medium text-[#171717]">
                  {formatRatingStars(displayRating)}
                </span>
                <span className="ml-2 text-sm text-[#737373]">
                  {RATING_LABELS[displayRating - 1]}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={selectedRating === null}
            >
              保存评分
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
