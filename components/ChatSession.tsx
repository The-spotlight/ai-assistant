'use client';

import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ToolCallCard from '@/components/ToolCallCard';
import SkillPanel from '@/components/SkillPanel';
import RefreshControl from '@/components/RefreshControl';
import {
  calculateMessageCost,
  formatCost,
  formatTokens,
  getModelPricing,
} from '@/lib/model-pricing';

const SUGGESTIONS = [
  '搜索今日新闻',
  'Python 计算质数',
  '计算圆周率小数点后 10 位',
  '分析一段话的情感倾向',
  '翻译成英文',
] as const;

type MessageWithTokens = Message & {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

type ChatSessionProps = {
  deviceId: string;
  conversationId: string;
  modelId: string;
  initialMessages: Message[];
  highlightMessageId?: string | null;
  onHighlightCleared?: () => void;
};

export type ChatSessionRef = {
  refreshMessages: () => Promise<boolean>;
};

function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function areMessagesEqual(a: Message, b: Message): boolean {
  if (a.id !== b.id || a.role !== b.role || a.content !== b.content) {
    return false;
  }
  const aWithTokens = a as MessageWithTokens;
  const bWithTokens = b as MessageWithTokens;
  if (aWithTokens.promptTokens !== bWithTokens.promptTokens) return false;
  if (aWithTokens.completionTokens !== bWithTokens.completionTokens) return false;
  if (aWithTokens.totalTokens !== bWithTokens.totalTokens) return false;
  const aTool = (a as { toolInvocations?: unknown[] }).toolInvocations;
  const bTool = (b as { toolInvocations?: unknown[] }).toolInvocations;
  if (aTool === undefined && bTool === undefined) return true;
  if (aTool === undefined || bTool === undefined) return false;
  return JSON.stringify(aTool) === JSON.stringify(bTool);
}

function hasMessageChanges(current: Message[], fresh: Message[]): boolean {
  if (current.length !== fresh.length) return true;
  for (let i = 0; i < current.length; i++) {
    if (!areMessagesEqual(current[i], fresh[i])) {
      return true;
    }
  }
  return false;
}

const ChatSession = forwardRef<ChatSessionRef, ChatSessionProps>(function ChatSession(
  {
    deviceId,
    conversationId,
    modelId,
    initialMessages,
    highlightMessageId,
    onHighlightCleared,
  },
  ref
) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
  } = useChat({
    api: '/api/chat',
    id: conversationId,
    initialMessages,
    body: { model: modelId, conversationId, deviceId },
    headers: { 'X-Device-Id': deviceId },
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showSkills, setShowSkills] = useState(false);

  type RegeneratePhase = 'idle' | 'truncated' | 'appending';
  const [regeneratePhase, setRegeneratePhase] = useState<RegeneratePhase>('idle');
  const regenerateDataRef = useRef<{
    userMessageId: string;
    userMessageContent: string;
  } | null>(null);
  const expectedMessageCountRef = useRef<number>(-1);

  const fetchLatestMessages = useCallback(async (): Promise<Message[] | null> => {
    try {
      const r = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: { 'x-device-id': deviceId },
      });
      if (!r.ok) return null;
      const data = (await r.json()) as { messages?: Message[] };
      return data.messages ?? null;
    } catch {
      return null;
    }
  }, [conversationId, deviceId]);

  const refreshMessages = useCallback(async (): Promise<boolean> => {
    if (isLoading || regeneratePhase !== 'idle') {
      return false;
    }

    const freshMessages = await fetchLatestMessages();
    if (!freshMessages) {
      return false;
    }

    if (!hasMessageChanges(messages, freshMessages)) {
      return false;
    }

    setMessages(freshMessages);
    return true;
  }, [isLoading, regeneratePhase, fetchLatestMessages, messages, setMessages]);

  useImperativeHandle(
    ref,
    () => ({
      refreshMessages,
    }),
    [refreshMessages]
  );

  const { totalTokens, totalCost } = useMemo(() => {
    let tokens = 0;
    let cost = 0;
    messages.forEach((m) => {
      const msg = m as MessageWithTokens;
      if (msg.promptTokens != null) {
        tokens += msg.promptTokens;
      }
      if (msg.completionTokens != null) {
        tokens += msg.completionTokens;
      }
      if (msg.promptTokens != null && msg.completionTokens != null) {
        cost += calculateMessageCost(msg.promptTokens, msg.completionTokens, modelId);
      }
    });
    return { totalTokens: tokens, totalCost: cost };
  }, [messages, modelId]);

  useEffect(() => {
    if (!highlightMessageId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, highlightMessageId]);

  useEffect(() => {
    if (highlightMessageId) {
      const messageEl = messageRefs.current.get(highlightMessageId);
      if (messageEl) {
        setTimeout(() => {
          messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [highlightMessageId, messages]);

  const handleClearHighlight = useCallback(() => {
    if (onHighlightCleared) {
      onHighlightCleared();
    }
  }, [onHighlightCleared]);

  const handleSkillInsert = (text: string) => {
    append({ role: 'user', content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && input === '') {
      e.preventDefault();
      setShowSkills(true);
    }
  };

  useEffect(() => {
    if (regeneratePhase !== 'truncated') return;
    if (!regenerateDataRef.current) return;

    const { userMessageId, userMessageContent } = regenerateDataRef.current;

    setRegeneratePhase('appending');

    append({
      role: 'user',
      content: userMessageContent,
      id: userMessageId,
    });
  }, [regeneratePhase, append]);

  useEffect(() => {
    if (!isLoading && regeneratePhase === 'appending') {
      const timer = setTimeout(() => {
        setRegeneratePhase('idle');
        regenerateDataRef.current = null;
        expectedMessageCountRef.current = -1;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, regeneratePhase]);

  const handleRegenerate = useCallback(
    (messageIndex: number) => {
      if (isLoading || regeneratePhase !== 'idle') return;

      const targetMessage = messages[messageIndex] as MessageWithTokens;
      if (targetMessage.role !== 'assistant') return;

      let userMessageIndex = -1;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMessageIndex = i;
          break;
        }
      }

      if (userMessageIndex === -1) return;

      const userMessage = messages[userMessageIndex];

      regenerateDataRef.current = {
        userMessageId: userMessage.id,
        userMessageContent: userMessage.content,
      };

      expectedMessageCountRef.current = userMessageIndex;

      const messagesBeforeUser = messages.slice(0, userMessageIndex);
      setMessages(messagesBeforeUser);

      setTimeout(() => {
        setRegeneratePhase('truncated');
      }, 0);
    },
    [messages, isLoading, regeneratePhase, setMessages]
  );

  const modelPricing = getModelPricing(modelId);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.06)]">
      {messages.length > 0 && (
        <div className="shrink-0 border-b border-black/[0.06] bg-white/80 px-4 py-2 text-xs text-[#737373]">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              模型：{modelPricing.label}
            </span>
            <span className="flex items-center gap-4">
              <span title="总 token 数">
                {formatTokens(totalTokens)} tokens
              </span>
              <span title="估算费用">
                {formatCost(totalCost)}
              </span>
            </span>
            <RefreshControl
              isLoading={isLoading || regeneratePhase !== 'idle'}
              onRefresh={refreshMessages}
            />
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-7">
        {messages.length === 0 && (
          <div className="mx-auto max-w-lg px-2 pt-4 text-center sm:pt-14">
            <p className="text-2xl font-semibold tracking-tight text-[#171717] sm:text-3xl" style={{ letterSpacing: '-1.28px' }}>
              你好，我是你的智能助手
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#4d4d4d]">
              支持联网搜索、计算、代码与文本分析。输入{' '}
              <kbd className="rounded border border-[rgba(0,0,0,0.08)] bg-[#fafafa] px-1.5 py-0.5 font-mono text-xs text-[#171717]">
                /
              </kbd>{' '}
              快速唤起技能面板
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-2.5">
              {SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => handleSkillInsert(text)}
                  className="rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-sm text-[#4d4d4d] transition-colors hover:border-neutral-300 hover:bg-neutral-100 hover:text-[#171717]"
                >
                  {text}
                </button>
              ))}
            </div>
            {deviceId && (
              <div className="mt-8">
                <RefreshControl
                  isLoading={isLoading || regeneratePhase !== 'idle'}
                  onRefresh={refreshMessages}
                />
              </div>
            )}
          </div>
        )}

        {highlightMessageId && (
          <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-2 rounded-lg bg-[#fef3c7] px-4 py-2.5 text-sm text-[#92400e] shadow-sm">
            <span className="font-medium">已定位到匹配消息</span>
            <button
              type="button"
              onClick={handleClearHighlight}
              className="text-[#92400e] hover:text-[#78350f] transition-colors font-medium"
            >
              清除高亮
            </button>
          </div>
        )}

        {messages.map((m, index) => {
          const isHighlighted = highlightMessageId === m.id;
          const msg = m as MessageWithTokens;
          const canRegenerate = m.role === 'assistant' && !isLoading && regeneratePhase === 'idle';

          const messageCost =
            msg.promptTokens != null && msg.completionTokens != null
              ? calculateMessageCost(msg.promptTokens, msg.completionTokens, modelId)
              : null;

          return (
            <div
              key={m.id}
              ref={(el) => {
                if (el) {
                  messageRefs.current.set(m.id, el);
                } else {
                  messageRefs.current.delete(m.id);
                }
              }}
              className={`flex w-full gap-3 transition-all duration-300 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              } ${
                isHighlighted
                  ? 'ring-2 ring-[#f59e0b] ring-offset-2 rounded-xl p-1 -mx-1'
                  : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  m.role === 'user'
                    ? 'bg-[#171717] text-white'
                    : 'border border-black/[0.06] bg-gradient-to-br from-[#f4f4f5] to-[#e4e4e7] text-[#525252]'
                }`}
              >
                {m.role === 'user' ? '我' : 'AI'}
              </div>
              <div className="min-w-0 max-w-[min(100%,36rem)]">
                <div
                  className={`min-w-0 ${
                    m.role === 'user'
                      ? 'rounded-2xl rounded-br-md bg-[#171717] px-4 py-3 text-[15px] leading-relaxed text-white'
                      : 'rounded-2xl rounded-tl-md border border-black/[0.06] bg-[#fafafa] px-4 py-3 text-[15px] leading-relaxed text-[#171717]'
                  } ${
                    isHighlighted ? 'ring-2 ring-[#f59e0b]' : ''
                  }`}
                  style={
                    m.role === 'assistant'
                      ? {
                          boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px',
                        }
                      : undefined
                  }
                >
                  {m.role === 'assistant' &&
                    (
                      m as {
                        toolInvocations?: Array<{
                          toolName: string;
                          args?: Record<string, unknown>;
                          result?: unknown;
                        }>;
                      }
                    ).toolInvocations?.map((inv, i) => (
                      <ToolCallCard
                        key={i}
                        toolName={inv.toolName}
                        args={inv.args || {}}
                        result={typeof inv.result === 'string' ? inv.result : undefined}
                      />
                    ))}

                  {m.content &&
                    (m.role === 'user' ? (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    ) : (
                      <MarkdownRenderer content={m.content} />
                    ))}
                </div>

                {m.role === 'assistant' && (
                  <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-3 text-[10px] text-[#a3a3a3]">
                      {msg.totalTokens != null && (
                        <span title={`输入: ${msg.promptTokens} tokens, 输出: ${msg.completionTokens} tokens`}>
                          {formatTokens(msg.totalTokens)} tokens
                          {messageCost != null && messageCost > 0 && (
                            <span className="ml-1">({formatCost(messageCost)})</span>
                          )}
                        </span>
                      )}
                    </div>
                    {canRegenerate && (
                      <button
                        type="button"
                        onClick={() => handleRegenerate(index)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
                        title="重新生成此回复"
                      >
                        <IconRefresh className="h-3 w-3" />
                        重新生成
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex w-full gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-gradient-to-br from-[#f4f4f5] to-[#e4e4e7] text-[11px] font-semibold text-[#525252]">
              AI
            </div>
            <div
              className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#666666]"
              style={{
                boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px',
              }}
            >
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#171717]/70" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#171717]/50" style={{ animationDelay: '160ms' }} />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#171717]/30" style={{ animationDelay: '320ms' }} />
              </span>
              正在生成…
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>

      <div className="shrink-0 border-t border-[rgba(0,0,0,0.08)] bg-white p-4 sm:p-5">
        <div className="relative mx-auto max-w-3xl">
          <SkillPanel
            visible={showSkills}
            onClose={() => setShowSkills(false)}
            onInsertPrompt={handleSkillInsert}
          />

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-lg bg-white p-2 sm:flex-row sm:items-center sm:gap-2 sm:p-2"
            style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="有问题，尽管问…"
              disabled={isLoading}
              className="min-h-[44px] flex-1 border-0 bg-transparent px-3 text-[15px] text-[#171717] placeholder:text-[#808080] focus:outline-none focus:ring-0 disabled:opacity-60"
            />
            <div className="flex items-center justify-end gap-1 sm:shrink-0">
              <button
                type="button"
                onClick={() => setShowSkills(!showSkills)}
                className="rounded px-3 py-2 text-sm text-[#4d4d4d] transition-colors hover:bg-[#fafafa] hover:text-[#171717]"
                title="技能"
              >
                技能
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="min-h-[40px] min-w-[88px] rounded-md bg-[#171717] px-5 text-sm font-medium text-white transition-colors hover:bg-[#000000] disabled:cursor-not-allowed disabled:opacity-40"
              >
                发送
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] text-[#808080]">内容由 AI 生成，请核对重要信息</p>
        </div>
      </div>
    </div>
  );
});

export default ChatSession;
