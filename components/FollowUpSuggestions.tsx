'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateFollowUpSuggestions, shouldShowFollowUpSuggestions } from '@/lib/follow-up-suggestions';
import { cn } from '@/lib/utils';

interface CustomModelConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  provider?: string;
}

interface FollowUpSuggestionsProps {
  /** AI 回复内容 */
  content: string;
  /** 用户的原始问题（可选，用于规则引擎兜底） */
  userMessage?: string;
  /** 是否正在加载中（AI 还在生成回复） */
  isLoading?: boolean;
  /** 点击推荐追问时的回调 */
  onSelectSuggestion: (suggestion: string) => void;
  /** 自定义类名 */
  className?: string;

  // === AI 生成相关的 props ===
  /** 会话 ID（用于调用 API） */
  conversationId?: string;
  /** 设备 ID（用于调用 API） */
  deviceId?: string;
  /** 消息列表（用于构建对话上下文） */
  messages?: Array<{ role: string; content: string }>;
  /** 自定义模型配置（可选） */
  customModelConfig?: CustomModelConfig;
  /** 是否启用 AI 生成（默认 true） */
  enableAIGeneration?: boolean;
}

/**
 * 推荐追问组件
 * 在 AI 回复结束后显示 2-3 个推荐追问按钮
 * 优先使用 AI 生成，失败时降级到规则引擎
 * 点击后将内容填入输入框
 */
export default function FollowUpSuggestions({
  content,
  userMessage,
  isLoading = false,
  onSelectSuggestion,
  className,
  conversationId,
  deviceId,
  messages,
  customModelConfig,
  enableAIGeneration = true,
}: FollowUpSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shouldShow, setShouldShow] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTriedAI, setHasTriedAI] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // 缓存已生成的推荐追问，避免重复请求
  const cacheRef = useRef<Map<string, string[]>>(new Map());
  const generatingRef = useRef(false);

  // 生成缓存 key
  const getCacheKey = useCallback(() => {
    if (!messages || messages.length === 0) {
      return content;
    }
    // 使用最后几条消息的哈希作为 key
    const lastMessages = messages.slice(-4);
    return lastMessages.map(m => `${m.role}:${m.content}`).join('|');
  }, [content, messages]);

  // 调用 API 获取 AI 生成的推荐追问
  const fetchAISuggestions = useCallback(async (): Promise<string[] | null> => {
    // 检查是否有必要的参数
    if (!conversationId || !deviceId || !messages || messages.length < 2) {
      console.warn('[FollowUpSuggestions] 缺少 AI 生成所需的参数');
      return null;
    }

    // 检查缓存
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && cached.length > 0) {
      console.log('[FollowUpSuggestions] 使用缓存的推荐追问');
      return cached;
    }

    try {
      const response = await fetch('/api/follow-up-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({
          conversationId,
          deviceId,
          messages,
          customModelConfig,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FollowUpSuggestions] API 请求失败:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.suggestions) && data.suggestions.length >= 2) {
        // 缓存结果
        cacheRef.current.set(cacheKey, data.suggestions);
        return data.suggestions;
      }

      console.log('[FollowUpSuggestions] AI 生成的推荐追问不足，返回 null 以使用兜底');
      return null;
    } catch (error) {
      console.error('[FollowUpSuggestions] 获取 AI 推荐追问失败:', error);
      return null;
    }
  }, [conversationId, deviceId, messages, customModelConfig, getCacheKey]);

  // 生成推荐追问（优先 AI，失败则规则引擎）
  const generateSuggestions = useCallback(async () => {
    if (!content || isLoading) {
      setShouldShow(false);
      setSuggestions([]);
      setIsGenerating(false);
      setHasTriedAI(false);
      setUseFallback(false);
      return;
    }

    // 检查是否应该显示推荐追问
    const show = shouldShowFollowUpSuggestions(content);
    setShouldShow(show);

    if (!show) {
      setSuggestions([]);
      return;
    }

    // 如果启用 AI 生成且有必要的参数，尝试 AI 生成
    if (enableAIGeneration && conversationId && deviceId && messages && messages.length >= 2 && !hasTriedAI) {
      // 防止重复生成
      if (generatingRef.current) {
        return;
      }
      generatingRef.current = true;
      setIsGenerating(true);

      const aiSuggestions = await fetchAISuggestions();
      generatingRef.current = false;
      setIsGenerating(false);
      setHasTriedAI(true);

      if (aiSuggestions && aiSuggestions.length >= 2) {
        setSuggestions(aiSuggestions);
        setUseFallback(false);
        return;
      }

      // AI 生成失败，使用规则引擎兜底
      console.log('[FollowUpSuggestions] AI 生成失败，使用规则引擎兜底');
      setUseFallback(true);
    }

    // 使用规则引擎生成推荐追问
    const fallbackSuggestions = generateFollowUpSuggestions(content, userMessage);
    setSuggestions(fallbackSuggestions);
  }, [content, userMessage, isLoading, enableAIGeneration, conversationId, deviceId, messages, hasTriedAI, fetchAISuggestions]);

  // 监听内容变化和加载状态
  useEffect(() => {
    // 当内容变化或加载状态变化时，重置状态
    setHasTriedAI(false);
    setUseFallback(false);
    generateSuggestions();
  }, [content, isLoading, conversationId, deviceId, messages]);

  // 处理推荐追问点击
  const handleSuggestionClick = (suggestion: string) => {
    onSelectSuggestion(suggestion);
  };

  // 如果不应该显示，或者正在加载中（AI 生成回复），不显示组件
  if (!shouldShow || isLoading) {
    return null;
  }

  // 正在生成推荐追问时，显示加载状态
  if (isGenerating) {
    return (
      <div className={cn('mt-3', className)}>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-[#a3a3a3]" />
          <span className="text-[11px] text-[#a3a3a3] font-medium">推荐追问</span>
        </div>
        <div className="flex items-center gap-2 px-1">
          <Loader2 className="h-3.5 w-3.5 text-[#a3a3a3] animate-spin" />
          <span className="text-[12px] text-[#a3a3a3]">正在生成推荐问题…</span>
        </div>
      </div>
    );
  }

  // 如果没有推荐追问，不显示组件
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-3', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-[#a3a3a3]" />
        <span className="text-[11px] text-[#a3a3a3] font-medium">推荐追问</span>
        {useFallback && (
          <span className="text-[10px] text-[#d4d4d4]">（智能模式）</span>
        )}
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

  // === AI 生成相关的 props ===
  /** 会话 ID */
  conversationId?: string;
  /** 设备 ID */
  deviceId?: string;
  /** 自定义模型配置 */
  customModelConfig?: CustomModelConfig;
  /** 是否启用 AI 生成 */
  enableAIGeneration?: boolean;
}

export function MessageFollowUpSuggestions({
  assistantContent,
  messageIndex,
  messages,
  isLoading,
  onSelectSuggestion,
  className,
  conversationId,
  deviceId,
  customModelConfig,
  enableAIGeneration = true,
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
      conversationId={conversationId}
      deviceId={deviceId}
      messages={messages}
      customModelConfig={customModelConfig}
      enableAIGeneration={enableAIGeneration}
    />
  );
}
