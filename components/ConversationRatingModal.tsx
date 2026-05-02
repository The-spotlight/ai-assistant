'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal } from 'antd';
import { Star } from 'lucide-react';
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

  const modalTitle = currentRating !== null
    ? `重新评分 (当前: ${formatRatingStars(currentRating)})`
    : '给对话评分';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={modalTitle}
      okText="保存评分"
      cancelText="取消"
      onOk={handleSave}
      okButtonProps={{ disabled: selectedRating === null }}
      centered
      width={420}
      destroyOnClose
    >
      <div className="text-center">
        <p className="text-sm text-[#737373] mb-8">
          您觉得这次对话怎么样？点击星星给对话打分
        </p>

        <div className="flex justify-center gap-4 mb-6">
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
          <div className="text-center">
            <span className="text-lg font-medium text-[#171717]">
              {formatRatingStars(displayRating)}
            </span>
            <span className="ml-2 text-sm text-[#737373]">
              {RATING_LABELS[displayRating - 1]}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
