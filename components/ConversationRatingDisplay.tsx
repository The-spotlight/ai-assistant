'use client';

import { Star } from 'lucide-react';
import { formatRatingStars } from '@/lib/conversation-rating';

type ConversationRatingDisplayProps = {
  rating: number | null;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

const RATING_LABELS = ['很差', '较差', '一般', '较好', '很好'];

export default function ConversationRatingDisplay({
  rating,
  onClick,
  size = 'md',
  showLabel = false,
}: ConversationRatingDisplayProps) {
  if (rating === null) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const starSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div
      className={`inline-flex items-center gap-1 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${sizeClasses[size]}`}
      onClick={onClick ? handleClick : undefined}
      title={onClick ? '点击重新评分' : undefined}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${starSize[size]} transition-colors ${
            i <= rating
              ? 'text-[#f59e0b] fill-[#f59e0b]'
              : 'text-[#d4d4d4]'
          }`}
        />
      ))}
      {showLabel && rating >= 1 && rating <= 5 && (
        <span className="text-[#737373] ml-1">
          {RATING_LABELS[rating - 1]}
        </span>
      )}
    </div>
  );
}

export function ConversationRatingTextDisplay({
  rating,
  onClick,
  className = '',
}: {
  rating: number | null;
  onClick?: () => void;
  className?: string;
}) {
  if (rating === null) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center text-[#f59e0b] font-medium ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick?.(); } : undefined}
      title={onClick ? '点击重新评分' : undefined}
    >
      {formatRatingStars(rating)}
    </span>
  );
}
