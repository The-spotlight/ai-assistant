'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { generateFollowUpSuggestions, shouldShowFollowUpSuggestions } from '@/lib/follow-up-suggestions';
import { cn } from '@/lib/utils';

interface FollowUpSuggestionsProps {
  /** AI 回复内容 */
  content: string;
  /** 用户的原始问题（可选，用于生成更相关的追问） */
  userMessage?: string;
  /** 是否正在加载中（AI 还在生成回复） */
  isLoading?: boolean;
  /** 点击推荐追问时的回调 */
  onSelectSuggestion: (suggestion: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 推荐追问组件
 * 在 AI 回复结束后显示 2-3 个推荐追问按钮
 * 点击后将内容填入输入框
 */
export default function FollowUpSuggestions({
  content,
  userMessage,
  isLoading = false,
  onSelectSuggestion,
  className,
}: FollowUpSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shouldShow, setShouldShow] = useState(false);

  // 生成推荐追问
  const generateSuggestions = useCallback(() => {
    if (!content || isLoading) {
      setShouldShow(false);
      setSuggestions([]);
      return;
    }

    // 检查是否应该显示推荐追问
    const show = shouldShowFollowUpSuggestions(content);
    setShouldShow(show);

    if (show) {
      // 生成推荐追问
      const newSuggestions = generateFollowUpSuggestions(content, userMessage);
      setSuggestions(newSuggestions);
    }
  }, [content, userMessage, isLoading]);

  // 监听内容变化和加载状态
  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  // 处理推荐追问点击
  const handleSuggestionClick = (suggestion: string) => {
    onSelectSuggestion(suggestion);
  };

  // 如果不应该显示，或者正在加载中，不显示组件
  if (!shouldShow || isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-3', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-[#a3a3a3]" />
        <span className="text-[11px] text-[#a3a3a3] font-medium">推荐追问</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-3 py-1.5 text-[12px] text-[#4d4d4d] transition-all duration-200 hover:border-[#171717]/20 hover:bg-[#fafafa] hover:text-[#171717] active:scale-95 dark:border-white/10 dark:bg-[#262626] dark:text-[#a3a3a3] dark:hover:border-white/20 dark:hover:bg-[#3d3d3d] dark:hover:text-white"
            title={`点击将"${suggestion}"填入输入框`}
          >
            <span className="text-[#737373] dark:text-[#a3a3a3]">→</span>
            <span>{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 用于消息列表中的推荐追问组件
 * 接收消息索引和消息列表，自动找到对应的用户消息
 */
interface MessageFollowUpSuggestionsProps {
  /** AI 消息内容 */
  assistantContent: string;
  /** 消息索引 */
  messageIndex: number;
  /** 消息列表 */
  messages: Array<{ role: string; content: string }>;
  /** 是否正在加载中 */
  isLoading: boolean;
  /** 点击推荐追问时的回调 */
  onSelectSuggestion: (suggestion: string) => void;
  /** 自定义类名 */
  className?: string;
}

export function MessageFollowUpSuggestions({
  assistantContent,
  messageIndex,
  messages,
  isLoading,
  onSelectSuggestion,
  className,
}: MessageFollowUpSuggestionsProps) {
  // 找到对应的用户消息（通常是前一条消息）
  const findUserMessage = () => {
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        return messages[i].content;
      }
    }
    return undefined;
  };

  const userMessage = findUserMessage();

  return (
    <FollowUpSuggestions
      content={assistantContent}
      userMessage={userMessage}
      isLoading={isLoading}
      onSelectSuggestion={onSelectSuggestion}
      className={className}
    />
  );
}
