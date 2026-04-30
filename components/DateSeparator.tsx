'use client';

import { useEffect, useRef, useState } from 'react';

type DateSeparatorProps = {
  date: string;
  isHighlighted?: boolean;
  onHighlightEnd?: () => void;
};

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = WEEKDAYS[date.getDay()];
    return `${month}月${day}日 ${weekday}`;
  }
}

export function isSameDay(dateStr1: string, dateStr2: string): boolean {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function DateSeparator({
  date,
  isHighlighted = false,
  onHighlightEnd,
}: DateSeparatorProps) {
  const [isHighlightActive, setIsHighlightActive] = useState(isHighlighted);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (isHighlighted) {
      setIsHighlightActive(true);
      
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      highlightTimeoutRef.current = setTimeout(() => {
        setIsHighlightActive(false);
        onHighlightEnd?.();
      }, 2000);
    }
    
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [isHighlighted, onHighlightEnd]);
  
  const dateLabel = formatDateLabel(date);
  
  return (
    <div
      className={`flex items-center justify-center gap-4 my-6 transition-all duration-500 ${
        isHighlightActive
          ? 'scale-105'
          : ''
      }`}
    >
      <div
        className={`flex-1 h-px transition-all duration-300 ${
          isHighlightActive
            ? 'bg-[#f59e0b]'
            : 'bg-black/[0.08]'
        }`}
      />
      <div
        className={`relative px-4 py-1 text-xs font-medium transition-all duration-300 rounded-full ${
          isHighlightActive
            ? 'bg-[#fef3c7] text-[#92400e] shadow-sm'
            : 'text-[#a3a3a3]'
        }`}
      >
        {dateLabel}
      </div>
      <div
        className={`flex-1 h-px transition-all duration-300 ${
          isHighlightActive
            ? 'bg-[#f59e0b]'
            : 'bg-black/[0.08]'
        }`}
      />
    </div>
  );
}
