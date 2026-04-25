'use client';

import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ToolCallCard from '@/components/ToolCallCard';
import SkillPanel from '@/components/SkillPanel';
import QuickCommandPanel from '@/components/QuickCommandPanel';
import TokenStatsPanel from '@/components/TokenStatsPanel';
import {
  calculateMessageCost,
  formatCost,
  formatTokens,
  getModelPricing,
} from '@/lib/model-pricing';
import {
  parseQuickCommand,
  getMatchingCommands,
} from '@/lib/tools/quick-commands';
import type { QuickCommand } from '@/lib/tools/quick-commands';
import { DEFAULT_OPENROUTER_MODEL_ID } from '@/lib/openrouter-models';

type MessageWithTokens = Message & {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt?: string;
};

type CompareSide = 'left' | 'right';

type CompareViewProps = {
  deviceId: string;
  leftConversationId: string | null;
  rightConversationId: string | null;
  leftInitialMessages: Message[];
  rightInitialMessages: Message[];
  activeSide: CompareSide;
  onActiveSideChange: (side: CompareSide) => void;
  onExitCompare: () => void;
  leftTitle: string | null;
  rightTitle: string | null;
  favoriteMessageIds?: Set<string>;
  onToggleFavorite?: (messageId: string, isFavorite: boolean) => void;
};

type AlignedRow = {
  time: string;
  leftMessage: MessageWithTokens | null;
  rightMessage: MessageWithTokens | null;
  type: 'user' | 'assistant' | 'mixed';
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

function IconBookmark(props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function IconEdit(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function MessageBubble({
  message,
  side,
  favoriteMessageIds,
  onToggleFavorite,
  isLoading = false,
}: {
  message: MessageWithTokens;
  side: CompareSide;
  favoriteMessageIds?: Set<string>;
  onToggleFavorite?: (messageId: string, isFavorite: boolean) => void;
  isLoading?: boolean;
}) {
  const isUser = message.role === 'user';
  const isFavorite = favoriteMessageIds?.has(message.id) ?? false;
  const modelPricing = getModelPricing(DEFAULT_OPENROUTER_MODEL_ID);

  const messageCost =
    message.promptTokens != null && message.completionTokens != null
      ? calculateMessageCost(message.promptTokens, message.completionTokens, DEFAULT_OPENROUTER_MODEL_ID)
      : null;

  return (
    <div
      className={`flex w-full gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          isUser
            ? 'bg-[#171717] text-white'
            : 'border border-black/[0.06] bg-gradient-to-br from-[#f4f4f5] to-[#e4e4e7] text-[#525252]'
        }`}
      >
        {isUser ? '我' : 'AI'}
      </div>
      <div className="min-w-0 max-w-[min(100%,30rem)]">
        <div
          className={`min-w-0 relative ${
            isUser
              ? 'rounded-2xl rounded-br-md bg-[#171717] px-4 py-3 text-[15px] leading-relaxed text-white'
              : 'rounded-2xl rounded-tl-md border border-black/[0.06] bg-[#fafafa] px-4 py-3 text-[15px] leading-relaxed text-[#171717]'
          }`}
          style={
            !isUser
              ? {
                  boxShadow:
                    'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px',
                }
              : undefined
          }
        >
          {!isUser && isFavorite && (
            <div className="absolute -top-1 -right-1">
              <IconBookmark className="h-4 w-4 text-[#f59e0b]" filled />
            </div>
          )}

          {!isUser &&
            (message as { toolInvocations?: Array<{ toolName: string; args?: Record<string, unknown>; result?: unknown }> }).toolInvocations?.map((inv, i) => (
              <ToolCallCard
                key={i}
                toolName={inv.toolName}
                args={inv.args || {}}
                result={typeof inv.result === 'string' ? inv.result : undefined}
              />
            ))}

          {message.content &&
            (isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <MarkdownRenderer content={message.content} />
            ))}
        </div>

        {!isUser && (
          <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-3 text-[10px] text-[#a3a3a3]">
              {message.totalTokens != null && (
                <span title={`输入: ${message.promptTokens} tokens, 输出: ${message.completionTokens} tokens`}>
                  {formatTokens(message.totalTokens)} tokens
                  {messageCost != null && messageCost > 0 && (
                    <span className="ml-1">({formatCost(messageCost)})</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(message.id, !isFavorite)}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors hover:bg-[#f5f5f5] ${
                    isFavorite ? 'text-[#f59e0b]' : 'text-[#737373] hover:text-[#171717]'
                  }`}
                  title={isFavorite ? '取消收藏' : '收藏此回复'}
                >
                  <IconBookmark className="h-3 w-3" filled={isFavorite} />
                  {isFavorite ? '已收藏' : '收藏'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
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
  );
}

function useChatSession({
  deviceId,
  conversationId,
  initialMessages,
}: {
  deviceId: string;
  conversationId: string | null;
  initialMessages: Message[];
}) {
  const {
    messages: chatMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
    setInput,
  } = useChat({
    api: '/api/chat',
    id: conversationId ?? undefined,
    initialMessages: conversationId ? initialMessages : [],
    body: {
      model: DEFAULT_OPENROUTER_MODEL_ID,
      conversationId: conversationId ?? '',
      deviceId,
    },
    headers: { 'X-Device-Id': deviceId },
  });

  const messages: MessageWithTokens[] = useMemo(() => {
    return chatMessages as MessageWithTokens[];
  }, [chatMessages]);

  const { totalTokens, totalCost } = useMemo(() => {
    let tokens = 0;
    let cost = 0;
    messages.forEach((m) => {
      if (m.promptTokens != null) tokens += m.promptTokens;
      if (m.completionTokens != null) tokens += m.completionTokens;
      if (m.promptTokens != null && m.completionTokens != null) {
        cost += calculateMessageCost(m.promptTokens, m.completionTokens, DEFAULT_OPENROUTER_MODEL_ID);
      }
    });
    return { totalTokens: tokens, totalCost: cost };
  }, [messages]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
    setInput,
    totalTokens,
    totalCost,
  };
}

function InputArea({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  side,
  placeholder,
}: {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  side: CompareSide;
  placeholder: string;
}) {
  const [showSkills, setShowSkills] = useState(false);
  const [matchingCommands, setMatchingCommands] = useState<QuickCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const showQuickCommands = matchingCommands.length > 0;

  useEffect(() => {
    const matching = getMatchingCommands(input);
    setMatchingCommands(matching);
    if (matching.length > 0 && selectedCommandIndex >= matching.length) {
      setSelectedCommandIndex(0);
    }
  }, [input, selectedCommandIndex]);

  const handleQuickCommandSelect = useCallback((command: QuickCommand) => {
    // 这里简化处理，直接设置输入框
  }, []);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const { command, argument } = parseQuickCommand(input);
      if (command && argument !== null) {
        // 简化处理，直接提交
      }
      handleSubmit(e);
    },
    [input, handleSubmit]
  );

  return (
    <div className="shrink-0 border-t border-[rgba(0,0,0,0.08)] bg-white p-4">
      <div className="relative mx-auto max-w-3xl">
        <SkillPanel
          visible={showSkills}
          onClose={() => setShowSkills(false)}
          onInsertPrompt={() => {}}
        />
        <QuickCommandPanel
          visible={showQuickCommands}
          commands={matchingCommands}
          onSelectCommand={handleQuickCommandSelect}
          selectedIndex={selectedCommandIndex}
          onClose={() => setMatchingCommands([])}
        />

        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col gap-3 rounded-lg bg-white p-2 sm:flex-row sm:items-center sm:gap-2 sm:p-2"
          style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
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
  );
}

function alignMessagesByTime(
  leftMessages: MessageWithTokens[],
  rightMessages: MessageWithTokens[]
): AlignedRow[] {
  const rows: AlignedRow[] = [];
  
  const TIME_WINDOW_MS = 60 * 1000;

  const leftWithIndex = leftMessages.map((m, i) => ({ message: m, originalIndex: i }));
  const rightWithIndex = rightMessages.map((m, i) => ({ message: m, originalIndex: i }));

  const allMessages: Array<{ message: MessageWithTokens; side: CompareSide; originalIndex: number }> = [];
  
  leftWithIndex.forEach(({ message, originalIndex }) => 
    allMessages.push({ message, side: 'left', originalIndex })
  );
  rightWithIndex.forEach(({ message, originalIndex }) => 
    allMessages.push({ message, side: 'right', originalIndex })
  );

  allMessages.sort((a, b) => {
    const timeA = a.message.createdAt ? new Date(a.message.createdAt).getTime() : a.originalIndex;
    const timeB = b.message.createdAt ? new Date(b.message.createdAt).getTime() : b.originalIndex;
    return timeA - timeB;
  });

  const usedLeftIds = new Set<string>();
  const usedRightIds = new Set<string>();

  for (let i = 0; i < allMessages.length; i++) {
    const current = allMessages[i];
    
    if ((current.side === 'left' && usedLeftIds.has(current.message.id)) ||
        (current.side === 'right' && usedRightIds.has(current.message.id))) {
      continue;
    }

    const currentTime = current.message.createdAt 
      ? new Date(current.message.createdAt).getTime() 
      : current.originalIndex;

    let matchedMessage: typeof current | null = null;
    
    for (let j = i + 1; j < allMessages.length; j++) {
      const candidate = allMessages[j];
      
      if ((candidate.side === 'left' && usedLeftIds.has(candidate.message.id)) ||
          (candidate.side === 'right' && usedRightIds.has(candidate.message.id))) {
        continue;
      }
      
      if (candidate.side === current.side) {
        continue;
      }
      
      if (candidate.message.role !== current.message.role) {
        continue;
      }
      
      const candidateTime = candidate.message.createdAt 
        ? new Date(candidate.message.createdAt).getTime() 
        : candidate.originalIndex;
      
      if (Math.abs(candidateTime - currentTime) <= TIME_WINDOW_MS) {
        matchedMessage = candidate;
        break;
      }
    }

    if (matchedMessage) {
      if (current.side === 'left') {
        rows.push({
          time: current.message.createdAt || '',
          leftMessage: current.message,
          rightMessage: matchedMessage.message,
          type: 'mixed',
        });
        usedLeftIds.add(current.message.id);
        usedRightIds.add(matchedMessage.message.id);
      } else {
        rows.push({
          time: current.message.createdAt || '',
          leftMessage: matchedMessage.message,
          rightMessage: current.message,
          type: 'mixed',
        });
        usedRightIds.add(current.message.id);
        usedLeftIds.add(matchedMessage.message.id);
      }
    } else {
      rows.push({
        time: current.message.createdAt || '',
        leftMessage: current.side === 'left' ? current.message : null,
        rightMessage: current.side === 'right' ? current.message : null,
        type: current.message.role as 'user' | 'assistant',
      });
      if (current.side === 'left') {
        usedLeftIds.add(current.message.id);
      } else {
        usedRightIds.add(current.message.id);
      }
    }
  }

  return rows;
}

export default function CompareView({
  deviceId,
  leftConversationId,
  rightConversationId,
  leftInitialMessages,
  rightInitialMessages,
  activeSide,
  onActiveSideChange,
  onExitCompare,
  leftTitle,
  rightTitle,
  favoriteMessageIds = new Set(),
  onToggleFavorite,
}: CompareViewProps) {
  const leftSession = useChatSession({
    deviceId,
    conversationId: leftConversationId,
    initialMessages: leftInitialMessages,
  });

  const rightSession = useChatSession({
    deviceId,
    conversationId: rightConversationId,
    initialMessages: rightInitialMessages,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showTokenStats, setShowTokenStats] = useState(false);

  const alignedRows = useMemo(() => {
    return alignMessagesByTime(leftSession.messages, rightSession.messages);
  }, [leftSession.messages, rightSession.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alignedRows, leftSession.isLoading, rightSession.isLoading]);

  const modelPricing = getModelPricing(DEFAULT_OPENROUTER_MODEL_ID);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.06)]">
      <div className="shrink-0 border-b border-black/[0.06] bg-white/80 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
                  activeSide === 'left'
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'
                }`}
                onClick={() => onActiveSideChange('left')}
              >
                <span className="text-sm font-medium">
                  {leftTitle?.trim() || '左侧对话'}
                </span>
                {leftSession.isLoading && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                )}
              </div>
            </div>

            <span className="text-[11px] text-[#a3a3a3] font-medium">VS</span>

            <div className="flex items-center gap-2">
              <div
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
                  activeSide === 'right'
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'
                }`}
                onClick={() => onActiveSideChange('right')}
              >
                <span className="text-sm font-medium">
                  {rightTitle?.trim() || '右侧对话'}
                </span>
                {rightSession.isLoading && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737373]">
              模型：{modelPricing.label}
            </span>
            <button
              type="button"
              onClick={onExitCompare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-sm text-[#525252] transition-colors hover:bg-[#fafafa]"
            >
              <IconX className="h-4 w-4" />
              退出对比
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-7">
        {(!leftConversationId || !rightConversationId) && (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-[#737373]">
                {!leftConversationId && !rightConversationId
                  ? '请从侧边栏选择两个对话进行对比'
                  : !leftConversationId
                  ? '请选择左侧对话'
                  : '请选择右侧对话'}
              </p>
              <p className="mt-2 text-sm text-[#a3a3a3]">
                点击侧边栏的左侧/右侧按钮，然后选择对话
              </p>
            </div>
          </div>
        )}

        {leftConversationId && rightConversationId && (
          <div className="space-y-6">
            {alignedRows.map((row, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex min-w-0 flex-1 flex-col">
                  {row.leftMessage ? (
                    <div className="border-l-2 border-black/[0.08] pl-3">
                      <div className="mb-1 text-[10px] text-[#a3a3a3]">
                        左侧
                      </div>
                      <MessageBubble
                        message={row.leftMessage}
                        side="left"
                        favoriteMessageIds={favoriteMessageIds}
                        onToggleFavorite={onToggleFavorite}
                      />
                    </div>
                  ) : (
                    <div className="min-h-[40px]" />
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-center justify-center">
                  <div className="h-px w-6 bg-[#e5e7eb]" />
                  <div className="my-1 text-[10px] text-[#d4d4d4]">
                    {row.time && new Date(row.time).toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="h-px w-6 bg-[#e5e7eb]" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  {row.rightMessage ? (
                    <div className="border-r-2 border-black/[0.08] pr-3">
                      <div className="mb-1 text-right text-[10px] text-[#a3a3a3]">
                        右侧
                      </div>
                      <MessageBubble
                        message={row.rightMessage}
                        side="right"
                        favoriteMessageIds={favoriteMessageIds}
                        onToggleFavorite={onToggleFavorite}
                      />
                    </div>
                  ) : (
                    <div className="min-h-[40px]" />
                  )}
                </div>
              </div>
            ))}

            {leftSession.isLoading && (
              <div className="flex gap-4">
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="border-l-2 border-black/[0.08] pl-3">
                    <div className="mb-1 text-[10px] text-[#a3a3a3]">左侧</div>
                    <LoadingIndicator />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center justify-center">
                  <div className="h-px w-6 bg-[#e5e7eb]" />
                  <div className="h-px w-6 bg-[#e5e7eb]" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col" />
              </div>
            )}

            {rightSession.isLoading && (
              <div className="flex gap-4">
                <div className="flex min-w-0 flex-1 flex-col" />
                <div className="flex shrink-0 flex-col items-center justify-center">
                  <div className="h-px w-6 bg-[#e5e7eb]" />
                  <div className="h-px w-6 bg-[#e5e7eb]" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="border-r-2 border-black/[0.08] pr-3">
                    <div className="mb-1 text-right text-[10px] text-[#a3a3a3]">右侧</div>
                    <LoadingIndicator />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
          </div>
        )}
      </div>

      {leftConversationId && rightConversationId && (
        <div className="shrink-0 border-t border-black/[0.06] bg-white/80 px-4 py-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onActiveSideChange('left')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                activeSide === 'left'
                  ? 'bg-[#171717] text-white'
                  : 'text-[#525252] hover:bg-[#f5f5f5]'
              }`}
            >
              <span className="font-medium">发送到左侧</span>
              {activeSide === 'left' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </button>

            <button
              type="button"
              onClick={() => onActiveSideChange('right')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                activeSide === 'right'
                  ? 'bg-[#171717] text-white'
                  : 'text-[#525252] hover:bg-[#f5f5f5]'
              }`}
            >
              <span className="font-medium">发送到右侧</span>
              {activeSide === 'right' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </button>
          </div>
        </div>
      )}

      {activeSide === 'left' && leftConversationId && (
        <InputArea
          input={leftSession.input}
          handleInputChange={leftSession.handleInputChange}
          handleSubmit={leftSession.handleSubmit}
          isLoading={leftSession.isLoading}
          side="left"
          placeholder={`发送到：${leftTitle?.trim() || '左侧对话'}`}
        />
      )}

      {activeSide === 'right' && rightConversationId && (
        <InputArea
          input={rightSession.input}
          handleInputChange={rightSession.handleInputChange}
          handleSubmit={rightSession.handleSubmit}
          isLoading={rightSession.isLoading}
          side="right"
          placeholder={`发送到：${rightTitle?.trim() || '右侧对话'}`}
        />
      )}
    </div>
  );
}
