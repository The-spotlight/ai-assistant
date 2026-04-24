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
  favoriteMessageIds?: Set<string>;
  onToggleFavorite?: (messageId: string, isFavorite: boolean) => void;
  templateContent?: string | null;
  onTemplateUsed?: () => void;
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

export default function ChatSession({
  deviceId,
  conversationId,
  modelId,
  initialMessages,
  highlightMessageId,
  onHighlightCleared,
  favoriteMessageIds = new Set(),
  onToggleFavorite,
  templateContent,
  onTemplateUsed,
}: ChatSessionProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
    setInput,
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
  const statsTriggerRef = useRef<HTMLDivElement>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [showTokenStats, setShowTokenStats] = useState(false);

  // 快捷指令相关状态
  const [matchingCommands, setMatchingCommands] = useState<QuickCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const showQuickCommands = matchingCommands.length > 0;

  // 编辑消息相关状态
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // 编辑模式下的 ref
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // 重新生成相关的状态和 ref
  // 使用状态机来确保操作的顺序性，避免 React 批量更新的竞态问题
  type RegeneratePhase = 'idle' | 'truncated' | 'appending';
  const [regeneratePhase, setRegeneratePhase] = useState<RegeneratePhase>('idle');
  const regenerateDataRef = useRef<{
    userMessageId: string;
    userMessageContent: string;
  } | null>(null);
  // 保存截断时期望的消息长度，用于验证截断是否成功
  const expectedMessageCountRef = useRef<number>(-1);

  // 计算总 token 数和费用
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

  // 滚动到底部（原有逻辑）
  useEffect(() => {
    if (!highlightMessageId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, highlightMessageId]);

  // 滚动到高亮消息
  useEffect(() => {
    if (highlightMessageId) {
      const messageEl = messageRefs.current.get(highlightMessageId);
      if (messageEl) {
        // 延迟一点确保 DOM 已渲染
        setTimeout(() => {
          messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [highlightMessageId, messages]);

  // 清除高亮
  const handleClearHighlight = useCallback(() => {
    if (onHighlightCleared) {
      onHighlightCleared();
    }
  }, [onHighlightCleared]);

  // 处理模板内容
  useEffect(() => {
    if (templateContent) {
      setInput(templateContent);
      inputRef.current?.focus();
      if (onTemplateUsed) {
        onTemplateUsed();
      }
    }
  }, [templateContent, setInput, onTemplateUsed]);

  const handleSkillInsert = (text: string) => {
    append({ role: 'user', content: text });
  };

  // 生成快捷指令的提示文本
  const generateQuickCommandPrompt = useCallback((command: QuickCommand, argument: string): string => {
    switch (command.toolName) {
      case 'web_search':
        return `请搜索：${argument}`;
      case 'weather':
        return `请查询${argument}的天气`;
      case 'calculator':
        return `请计算：${argument}`;
      case 'translator':
        return `请翻译：${argument}`;
      case 'text_analyzer':
        return `请分析这段文本：${argument}`;
      case 'code_execution':
        return `请执行以下 Python 代码：\n\`\`\`python\n${argument}\n\`\`\``;
      default:
        return argument;
    }
  }, []);

  // 处理快捷指令选择
  const handleQuickCommandSelect = useCallback((command: QuickCommand) => {
    setInput(`/${command.command} `);
    setMatchingCommands([]);
    setSelectedCommandIndex(0);
    inputRef.current?.focus();
  }, [setInput]);

  // 监听输入变化，更新匹配的快捷指令
  useEffect(() => {
    const matching = getMatchingCommands(input);
    setMatchingCommands(matching);
    if (matching.length > 0 && selectedCommandIndex >= matching.length) {
      setSelectedCommandIndex(0);
    }
  }, [input, selectedCommandIndex]);

  // 自定义表单提交处理
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 解析快捷指令
    const { command, argument } = parseQuickCommand(input);
    
    if (command && argument !== null) {
      // 如果是有效的快捷指令且有参数（有空格），即使参数为空字符串也允许提交
      // 这样用户可以搜索空格或其他特殊字符
      const prompt = generateQuickCommandPrompt(command, argument);
      append({ role: 'user', content: prompt });
      setInput('');
    } else if (command && argument === null) {
      // 如果有指令但没有参数（没有空格，如 /搜索），不提交，等待用户输入参数
      return;
    } else {
      // 正常提交
      handleSubmit(e);
    }
  }, [input, append, setInput, handleSubmit, generateQuickCommandPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 快捷指令导航
    if (showQuickCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => 
          prev < matchingCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => 
          prev > 0 ? prev - 1 : matchingCommands.length - 1
        );
        return;
      }
      if (e.key === 'Enter' && matchingCommands.length > 0) {
        e.preventDefault();
        const selectedCmd = matchingCommands[selectedCommandIndex];
        if (selectedCmd) {
          handleQuickCommandSelect(selectedCmd);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMatchingCommands([]);
        return;
      }
    }

    // 输入 / 时，快捷指令面板会自动显示，不再显示技能面板
    // 技能面板只在点击"技能"按钮时显示
  };

  // 使用 useEffect 来处理重新生成的第二阶段：截断后发送消息
  // 这样可以确保 React 状态更新完成后再执行下一步操作
  useEffect(() => {
    if (regeneratePhase !== 'truncated') return;
    if (!regenerateDataRef.current) return;

    const { userMessageId, userMessageContent } = regenerateDataRef.current;

    // 验证消息列表是否已截断
    // 注意：这里我们假设 setMessages 已经生效
    // 在 React 18+ 中，状态更新是同步的（在同一事件循环中）

    // 进入 appending 阶段，防止重复触发
    setRegeneratePhase('appending');

    // 发送用户消息，触发重新生成
    append({
      role: 'user',
      content: userMessageContent,
      id: userMessageId,
    });
  }, [regeneratePhase, append]);

  // 监听 isLoading 变化，当生成完成时重置状态
  useEffect(() => {
    if (!isLoading && regeneratePhase === 'appending') {
      // 等待一小段时间确保状态稳定
      const timer = setTimeout(() => {
        setRegeneratePhase('idle');
        regenerateDataRef.current = null;
        expectedMessageCountRef.current = -1;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, regeneratePhase]);

  // 编辑模式下自动聚焦输入框
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 50);
    }
  }, [editingMessageId]);

  // 开始编辑消息
  const handleEditMessage = useCallback(
    (messageId: string, content: string) => {
      if (isLoading || regeneratePhase !== 'idle') return;
      setEditingMessageId(messageId);
      setEditingContent(content);
    },
    [isLoading, regeneratePhase]
  );

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  // 确认编辑并重新发送
  const handleConfirmEdit = useCallback(
    (messageId: string) => {
      if (isLoading || regeneratePhase !== 'idle') return;
      if (!editingContent.trim()) return;

      // 找到该用户消息的索引
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];
      if (message.role !== 'user') return;

      // 保存编辑后的用户消息信息到 ref
      regenerateDataRef.current = {
        userMessageId: messageId,
        userMessageContent: editingContent.trim(),
      };

      // 保存截断后期望的消息长度
      expectedMessageCountRef.current = messageIndex;

      // 第一阶段：截断消息列表到用户消息之前（不包含用户消息）
      const messagesBeforeUser = messages.slice(0, messageIndex);
      setMessages(messagesBeforeUser);

      // 重置编辑状态
      setEditingMessageId(null);
      setEditingContent('');

      // 设置阶段为 truncated，触发 useEffect 执行下一步
      setTimeout(() => {
        setRegeneratePhase('truncated');
      }, 0);
    },
    [messages, isLoading, regeneratePhase, editingContent, setMessages]
  );

  // 重新生成消息
  const handleRegenerate = useCallback(
    (messageIndex: number) => {
      // 防止重复点击：如果正在加载或已经在重新生成流程中，忽略
      if (isLoading || regeneratePhase !== 'idle') return;

      // 找到目标 AI 消息
      const targetMessage = messages[messageIndex] as MessageWithTokens;
      if (targetMessage.role !== 'assistant') return;

      // 向前找对应的用户消息（通常是前一条）
      let userMessageIndex = -1;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMessageIndex = i;
          break;
        }
      }

      if (userMessageIndex === -1) return;

      const userMessage = messages[userMessageIndex];

      // 保存用户消息信息到 ref（避免闭包问题）
      regenerateDataRef.current = {
        userMessageId: userMessage.id,
        userMessageContent: userMessage.content,
      };

      // 保存截断后期望的消息长度
      expectedMessageCountRef.current = userMessageIndex;

      // 第一阶段：截断消息列表到用户消息之前（不包含用户消息）
      const messagesBeforeUser = messages.slice(0, userMessageIndex);
      setMessages(messagesBeforeUser);

      // 设置阶段为 truncated，触发 useEffect 执行下一步
      // 使用 setTimeout 0 来确保在下一个事件循环中处理
      // 这样可以避免 React 批量更新导致的时序问题
      setTimeout(() => {
        setRegeneratePhase('truncated');
      }, 0);
    },
    [messages, isLoading, regeneratePhase, setMessages]
  );

  const modelPricing = getModelPricing(modelId);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.06)]">
      {/* 顶部状态栏：显示 token 和费用 */}
      {messages.length > 0 && (
        <div className="relative shrink-0 border-b border-black/[0.06] bg-white/80 px-4 py-2 text-xs text-[#737373]">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              模型：{modelPricing.label}
            </span>
            <div
              ref={statsTriggerRef}
              className="flex items-center gap-4 cursor-pointer hover:text-[#4d4d4d] transition-colors select-none"
              onClick={() => setShowTokenStats(!showTokenStats)}
            >
              <span title="总 token 数">
                {formatTokens(totalTokens)} tokens
              </span>
              <span
                className="inline-flex items-center gap-1"
                title="点击查看详细消耗"
              >
                {formatCost(totalCost)}
                <svg
                  className="h-3 w-3 transition-transform"
                  style={{ transform: showTokenStats ? 'rotate(180deg)' : 'none' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>

          <TokenStatsPanel
            visible={showTokenStats}
            onClose={() => setShowTokenStats(false)}
            messages={messages}
            modelId={modelId}
            totalTokens={totalTokens}
            totalCost={totalCost}
            triggerRef={statsTriggerRef}
          />
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
          </div>
        )}

        {/* 高亮提示条 */}
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
          const isLastAssistant = m.role === 'assistant' && index === messages.length - 1 && !isLoading;
          const canRegenerate = m.role === 'assistant';
          const isRegenerating = isLoading || regeneratePhase !== 'idle';

          // 计算单条消息的费用（如果有 token 数据）
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
                  className={`min-w-0 relative ${
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
                  {m.role === 'assistant' && favoriteMessageIds.has(m.id) && (
                    <div className="absolute -top-1 -right-1">
                      <IconBookmark className="h-4 w-4 text-[#f59e0b]" filled />
                    </div>
                  )}
                  
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

                  {m.role === 'user' && editingMessageId === m.id ? (
                    <textarea
                      ref={editInputRef}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleConfirmEdit(m.id);
                        }
                        if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="w-full resize-none rounded-lg border border-white/10 bg-[#262626] px-3 py-2 text-[15px] leading-relaxed text-white placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-white/20"
                      rows={Math.max(3, editingContent.split('\n').length)}
                    />
                  ) : (
                    m.content &&
                    (m.role === 'user' ? (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    ) : (
                      <MarkdownRenderer content={m.content} />
                    ))
                  )}

                  {/* 编辑模式下的按钮 */}
                  {m.role === 'user' && editingMessageId === m.id && (
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-[12px] text-white/80 transition-colors hover:bg-white/10"
                      >
                        <IconX className="h-3 w-3" />
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmEdit(m.id)}
                        disabled={!editingContent.trim()}
                        className="inline-flex items-center gap-1 rounded bg-white px-3 py-1.5 text-[12px] font-medium text-[#171717] transition-colors hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <IconCheck className="h-3 w-3" />
                        确认
                      </button>
                    </div>
                  )}
                </div>

                {/* 消息操作栏：收藏按钮 + 重新生成按钮 + token 信息 + 编辑按钮 */}
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
                    <div className="flex items-center gap-1">
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(m.id, !favoriteMessageIds.has(m.id))}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors hover:bg-[#f5f5f5] ${
                            favoriteMessageIds.has(m.id)
                              ? 'text-[#f59e0b]'
                              : 'text-[#737373] hover:text-[#171717]'
                          }`}
                          title={favoriteMessageIds.has(m.id) ? '取消收藏' : '收藏此回复'}
                        >
                          <IconBookmark className="h-3 w-3" filled={favoriteMessageIds.has(m.id)} />
                          {favoriteMessageIds.has(m.id) ? '已收藏' : '收藏'}
                        </button>
                      )}
                      {canRegenerate && (
                        <button
                          type="button"
                          onClick={() => handleRegenerate(index)}
                          disabled={isRegenerating}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors ${
                            isRegenerating
                              ? 'text-[#a3a3a3] cursor-not-allowed'
                              : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
                          }`}
                          title={isRegenerating ? '正在生成，请稍候...' : '重新生成此回复'}
                        >
                          <IconRefresh className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                          {isRegenerating ? '正在生成…' : '重新生成'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 用户消息操作栏：编辑按钮 */}
                {m.role === 'user' && editingMessageId !== m.id && (
                  <div className="mt-1.5 flex items-center justify-end gap-1 px-1">
                    {!isLoading && regeneratePhase === 'idle' && (
                      <button
                        type="button"
                        onClick={() => handleEditMessage(m.id, m.content)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
                        title="编辑此消息"
                      >
                        <IconEdit className="h-3 w-3" />
                        编辑
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
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="有问题，尽管问… 输入 / 查看快捷指令"
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
}
