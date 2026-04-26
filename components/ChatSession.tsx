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
import { useSettings, FONT_SIZES, BUBBLE_STYLES, type TimestampFormatKey, type SendShortcutKey } from '@/lib/settings';

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
  replyToId?: string | null;
  replyToSnapshot?: string | null;
  createdAt?: string;
};

type ReplyInfo = {
  messageId: string;
  content: string;
  createdAt: string;
  role: string;
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

function IconMoreVertical(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function IconDownload(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconShare(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconLoader(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function IconAlertCircle(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconReply(props: React.SVGProps<SVGSVGElement>) {
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
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
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
  const { settings, themeColors, behavior, model } = useSettings();
  const bubbleStyle = BUBBLE_STYLES[settings.bubbleStyle];
  const fontSizeConfig = FONT_SIZES[settings.fontSize];

  // 引用回复相关 ref（放在 useChat 之前，用于动态 body）
  const replyingToRef = useRef<ReplyInfo | null>(null);

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
    body: () => {
      const body: Record<string, unknown> = { 
        model: model.defaultModel || modelId, 
        conversationId, 
        deviceId,
        temperature: model.temperature,
        maxTokens: model.maxTokens,
        streaming: model.streaming,
      };
      
      // 如果有引用信息，添加到 body
      if (replyingToRef.current) {
        body.replyTo = {
          messageId: replyingToRef.current.messageId,
          content: replyingToRef.current.content,
          createdAt: replyingToRef.current.createdAt,
          role: replyingToRef.current.role,
        };
      }
      
      return body;
    },
    headers: { 'X-Device-Id': deviceId },
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const statsTriggerRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [showTokenStats, setShowTokenStats] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 分享相关状态
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // 分享列表状态
  const [shares, setShares] = useState<Array<{
    shareId: string;
    shareUrl: string;
    title: string;
    expiresAt: string | null;
    hasPassword: boolean;
    createdAt: string;
    viewCount: number;
  }>>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

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
  // 记录正在重新生成的消息ID，用于在UI中显示加载状态
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const regenerateDataRef = useRef<{
    userMessageId: string;
    userMessageContent: string;
  } | null>(null);
  // 保存截断时期望的消息长度，用于验证截断是否成功
  const expectedMessageCountRef = useRef<number>(-1);

  // 引用回复相关状态
  const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 格式化相对时间
  const formatRelativeTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay === 1) return '昨天';
    if (diffDay < 7) return `${diffDay} 天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }, []);

  // 格式化绝对时间
  const formatAbsoluteTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // 根据设置格式化时间显示
  const formatTime = useCallback((dateStr: string, format: TimestampFormatKey) => {
    if (format === 'hidden') return null;
    if (format === 'absolute') return formatAbsoluteTime(dateStr);
    return formatRelativeTime(dateStr);
  }, [formatAbsoluteTime, formatRelativeTime]);

  // 处理引用按钮点击
  const handleReply = useCallback((message: Message) => {
    const replyInfo: ReplyInfo = {
      messageId: message.id,
      content: message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
      createdAt: new Date().toISOString(),
      role: message.role,
    };
    setReplyingTo(replyInfo);
    replyingToRef.current = replyInfo;
    inputRef.current?.focus();
  }, []);

  // 取消引用
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
    replyingToRef.current = null;
  }, []);

  // 跳转到引用的消息并高亮
  const handleJumpToMessage = useCallback((messageId: string) => {
    const messageEl = messageRefs.current.get(messageId);
    if (messageEl) {
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 清除之前的定时器
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      
      // 设置高亮
      setHighlightedMessageId(messageId);
      
      // 3秒后清除高亮
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    }
  }, []);

  // 清理高亮定时器
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

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

  // 导出当前对话
  const handleExport = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/export`, {
        headers: { 'x-device-id': deviceId },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `对话_${conversationId}.md`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowMenu(false);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    }
  }, [conversationId, deviceId]);

  // 获取分享列表
  const fetchShares = useCallback(async () => {
    try {
      setIsLoadingShares(true);
      const response = await fetch(`/api/conversations/${conversationId}/share`, {
        headers: { 'x-device-id': deviceId },
      });

      if (!response.ok) {
        throw new Error('获取分享列表失败');
      }

      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error('获取分享列表失败:', error);
    } finally {
      setIsLoadingShares(false);
    }
  }, [conversationId, deviceId]);

  // 分享当前对话
  const handleShare = useCallback(async () => {
    if (messages.length === 0) {
      setShareError('空对话无法分享');
      setShowShareModal(true);
      setShowMenu(false);
      return;
    }

    try {
      setIsSharing(true);
      setShareError(null);

      const response = await fetch(`/api/conversations/${conversationId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '创建分享失败');
      }

      const data = (await response.json()) as { shareUrl: string };
      setShareUrl(data.shareUrl);
      // 生成新分享后获取分享列表
      await fetchShares();
      setShowShareModal(true);
      setShowMenu(false);
    } catch (error) {
      console.error('分享失败:', error);
      setShareError(error instanceof Error ? error.message : '创建分享失败');
      setShowShareModal(true);
      setShowMenu(false);
    } finally {
      setIsSharing(false);
    }
  }, [conversationId, deviceId, messages.length, fetchShares]);

  // 复制分享链接
  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制链接失败:', error);
    }
  }, [shareUrl]);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

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
    
    // 保存引用信息，然后清除 UI 状态
    const hasReply = !!replyingToRef.current;
    
    if (command && argument !== null) {
      // 如果是有效的快捷指令且有参数（有空格），即使参数为空字符串也允许提交
      // 这样用户可以搜索空格或其他特殊字符
      const prompt = generateQuickCommandPrompt(command, argument);
      append({ role: 'user', content: prompt });
      setInput('');
      // 提交后清除引用状态
      setReplyingTo(null);
      replyingToRef.current = null;
    } else if (command && argument === null) {
      // 如果有指令但没有参数（没有空格，如 /搜索），不提交，等待用户输入参数
      return;
    } else {
      // 正常提交
      handleSubmit(e);
      // 提交后清除引用状态
      // 注意：这里需要延迟一点，确保 useChat 已经读取了 body 中的引用信息
      setTimeout(() => {
        setReplyingTo(null);
        replyingToRef.current = null;
      }, 0);
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

    // 发送快捷键处理
    const isEnter = e.key === 'Enter';
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    if (isEnter && input.trim() && !isLoading) {
      if (behavior.sendShortcut === 'enter') {
        if (!isCtrlOrCmd && !e.shiftKey) {
          e.preventDefault();
          handleFormSubmit(e);
        }
      } else if (behavior.sendShortcut === 'ctrlEnter') {
        if (isCtrlOrCmd) {
          e.preventDefault();
          handleFormSubmit(e);
        }
      }
    }
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
        setRegeneratingMessageId(null);
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

      // 记录正在重新生成的消息ID，用于在UI中显示加载状态
      setRegeneratingMessageId(targetMessage.id);

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
      {messages.length > 0 && behavior.showTokenStats && (
        <div className="relative shrink-0 border-b border-black/[0.06] bg-white/80 px-4 py-2 text-xs text-[#737373]">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              模型：{modelPricing.label}
            </span>
            <div className="flex items-center gap-2">
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
              <div className="relative" ref={menuContainerRef}>
                <button
                  ref={menuTriggerRef}
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
                  title="更多选项"
                >
                  <IconMoreVertical className="h-4 w-4" />
                </button>

                {/* 下拉菜单 */}
                {showMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={isSharing || messages.length === 0}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#171717] transition-colors hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSharing ? (
                        <IconLoader className="h-4 w-4 text-[#737373] animate-spin" />
                      ) : (
                        <IconShare className="h-4 w-4 text-[#737373]" />
                      )}
                      <span>{isSharing ? '分享中…' : '分享'}</span>
                    </button>
                    <div className="h-px bg-black/[0.06]" />
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#171717] transition-colors hover:bg-[#fafafa]"
                    >
                      <IconDownload className="h-4 w-4 text-[#737373]" />
                      <span>导出为 Markdown</span>
                    </button>
                  </div>
                )}
              </div>
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
          const isHighlighted = highlightMessageId === m.id || highlightedMessageId === m.id;
          const msg = m as MessageWithTokens;
          const isLastAssistant = m.role === 'assistant' && index === messages.length - 1 && !isLoading;
          const canRegenerate = m.role === 'assistant';
          // 只有当前消息是正在重新生成的消息时，才显示加载状态
          // 这样用户可以明确知道是哪条消息在重新生成
          const isThisMessageRegenerating = m.id === regeneratingMessageId;
          // 全局重新生成状态：当任何消息在重新生成时，其他消息的按钮应该被禁用
          // 但是不显示加载状态，只有正在重新生成的那条消息显示加载状态
          const isGlobalRegenerating = isLoading || regeneratePhase !== 'idle';

          // 计算单条消息的费用（如果有 token 数据）
          const messageCost =
            msg.promptTokens != null && msg.completionTokens != null
              ? calculateMessageCost(msg.promptTokens, msg.completionTokens, modelId)
              : null;

          // 解析引用快照
          const hasReply = msg.replyToId || msg.replyToSnapshot;
          const replySnapshot = msg.replyToSnapshot;
          let replyContent = '';
          let replyTime = '';
          let isReplyDeleted = false;
          
          if (replySnapshot) {
            try {
              const parsed = JSON.parse(replySnapshot);
              replyContent = parsed.content || '';
              replyTime = parsed.createdAt || '';
              isReplyDeleted = parsed.isDeleted || false;
            } catch {
              // 如果解析失败，直接使用原始字符串
              replyContent = replySnapshot;
            }
            
            // 额外判断：如果有快照但 replyToId 为 null，说明原消息已被删除
            // 因为 onDelete: SetNull 会在原消息删除时将 replyToId 设为 null
            if (msg.replyToId == null) {
              isReplyDeleted = true;
            }
          }

          const messageBubbleStyle = {
            fontSize: fontSizeConfig.value,
            lineHeight: fontSizeConfig.lineHeight,
            backgroundColor: m.role === 'user' ? themeColors.userBubble : themeColors.aiBubble,
            color: m.role === 'user' ? themeColors.userText : themeColors.aiText,
            borderRadius: m.role === 'user' ? undefined : undefined,
          };

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
              className={`flex w-full gap-3 transition-all duration-300 group ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              } ${
                isHighlighted
                  ? 'ring-2 ring-[#f59e0b] ring-offset-2 rounded-xl p-1 -mx-1 animate-pulse'
                  : ''
              } ${bubbleStyle.spacing}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  m.role === 'user'
                    ? 'text-white'
                    : 'border bg-gradient-to-br from-[#f4f4f5] to-[#e4e4e7] text-[#525252]'
                }`}
                style={{
                  backgroundColor: m.role === 'user' ? themeColors.primary : undefined,
                  borderColor: themeColors.border,
                }}
              >
                {m.role === 'user' ? '我' : 'AI'}
              </div>
              <div className="min-w-0 max-w-[min(100%,36rem)]">
                <div
                  className={`min-w-0 relative ${
                    m.role === 'user'
                      ? 'rounded-2xl rounded-br-md'
                      : 'rounded-2xl rounded-tl-md border shadow-sm'
                  } ${bubbleStyle.padding} ${
                    isHighlighted ? 'ring-2 ring-[#f59e0b]' : ''
                  }`}
                  style={{
                    ...messageBubbleStyle,
                    borderColor: m.role === 'assistant' ? themeColors.border : undefined,
                  }}
                >
                  {m.role === 'assistant' && favoriteMessageIds.has(m.id) && (
                    <div className="absolute -top-1 -right-1">
                      <IconBookmark className="h-4 w-4 text-[#f59e0b]" filled />
                    </div>
                  )}
                  
                  {/* 引用显示 */}
                  {hasReply && (
                    <div
                      className={`mb-2 cursor-pointer rounded-lg px-3 py-2 text-xs transition-colors ${
                        m.role === 'user'
                          ? 'bg-white/10 hover:bg-white/20 text-white/80'
                          : 'bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#737373]'
                      }`}
                      onClick={() => {
                        if (msg.replyToId && !isReplyDeleted) {
                          handleJumpToMessage(msg.replyToId);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <IconReply className="h-3 w-3" />
                        <span className="font-medium">
                          {isReplyDeleted 
                            ? '原消息已删除' 
                            : (() => {
                                const formattedTime = replyTime ? formatTime(replyTime, behavior.timestampFormat) : null;
                                if (formattedTime) {
                                  return `引用 ${formattedTime}`;
                                }
                                return '引用';
                              })()
                          }
                        </span>
                      </div>
                      <div className="mt-1 truncate">
                        {isReplyDeleted ? (
                          <span className="italic text-[#a3a3a3]">原消息已删除</span>
                        ) : (
                          replyContent
                        )}
                      </div>
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

                {/* 消息操作栏：收藏按钮 + 重新生成按钮 + token 信息 + 编辑按钮 + 引用按钮 */}
                {m.role === 'assistant' && (
                  <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-3 text-[10px] text-[#a3a3a3]">
                      {msg.createdAt && (() => {
                        const formattedTime = formatTime(msg.createdAt, behavior.timestampFormat);
                        if (formattedTime) {
                          return <span className="text-[#a3a3a3]">{formattedTime}</span>;
                        }
                        return null;
                      })()}
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
                      {/* 引用按钮 - 悬停显示 */}
                      <button
                        type="button"
                        onClick={() => handleReply(m)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors ${
                          isGlobalRegenerating
                            ? 'text-[#a3a3a3] cursor-not-allowed opacity-0 group-hover:opacity-100'
                            : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717] opacity-0 group-hover:opacity-100'
                        }`}
                        title="引用回复此消息"
                        disabled={isGlobalRegenerating}
                      >
                        <IconReply className="h-3 w-3" />
                        引用
                      </button>
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
                          disabled={isGlobalRegenerating}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors ${
                            isGlobalRegenerating
                              ? 'text-[#a3a3a3] cursor-not-allowed'
                              : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
                          }`}
                          title={isThisMessageRegenerating ? '正在生成，请稍候...' : '重新生成此回复'}
                        >
                          <IconRefresh className={`h-3 w-3 ${isThisMessageRegenerating ? 'animate-spin' : ''}`} />
                          {isThisMessageRegenerating ? '正在生成…' : '重新生成'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 用户消息操作栏：编辑按钮 + 引用按钮 */}
                {m.role === 'user' && editingMessageId !== m.id && (
                  <div className="mt-1.5 flex items-center justify-between gap-1 px-1">
                    {msg.createdAt && (() => {
                      const formattedTime = formatTime(msg.createdAt, behavior.timestampFormat);
                      if (formattedTime) {
                        return <span className="text-[10px] text-[#a3a3a3]">{formattedTime}</span>;
                      }
                      return null;
                    })()}
                    <div className="flex items-center gap-1">
                      {/* 引用按钮 - 悬停显示 */}
                      {!isLoading && regeneratePhase === 'idle' && (
                        <button
                          type="button"
                          onClick={() => handleReply(m)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717] opacity-0 group-hover:opacity-100"
                          title="引用回复此消息"
                        >
                          <IconReply className="h-3 w-3" />
                          引用
                        </button>
                      )}
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

          {/* 引用预览 */}
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-3 py-2">
              <IconReply className="h-4 w-4 text-[#737373]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#737373]">
                    引用 {replyingTo.role === 'user' ? '我' : 'AI'} 的消息
                  </span>
                  {(() => {
                    const formattedTime = formatTime(replyingTo.createdAt, behavior.timestampFormat);
                    if (formattedTime) {
                      return (
                        <span className="text-xs text-[#a3a3a3]">
                          {formattedTime}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <p className="truncate text-xs text-[#737373]">
                  {replyingTo.content}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelReply}
                className="shrink-0 rounded p-1 text-[#a3a3a3] transition-colors hover:bg-[#e5e5e5] hover:text-[#737373]"
                title="取消引用"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          )}

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

      {/* 分享模态框 */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            {shareError ? (
              <>
                <div className="mb-4 flex justify-center">
                  <IconAlertCircle className="h-12 w-12 text-[#ef4444]" />
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享失败</h3>
                <p className="mb-6 text-center text-sm text-[#737373]">{shareError}</p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      setShareError(null);
                    }}
                    className="rounded-lg bg-[#171717] px-6 py-2 text-sm font-medium text-white transition hover:bg-black"
                  >
                    关闭
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex justify-center">
                  <IconShare className="h-12 w-12 text-[#171717]" />
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享链接已生成</h3>
                <p className="mb-4 text-center text-sm text-[#737373]">
                  任何人都可以通过以下链接查看此对话（只读）
                </p>
                {shareUrl && (
                  <div className="mb-6 flex items-center gap-2 rounded-lg border border-black/[0.08] bg-[#fafafa] p-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-[#171717]">{shareUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyShareUrl}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        copied
                          ? 'border-[#22c55e] bg-[#f0fdf4] text-[#22c55e]'
                          : 'border-black/[0.08] bg-white text-[#171717] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {copied ? (
                        <>
                          <IconCheck className="h-3.5 w-3.5" />
                          已复制
                        </>
                      ) : (
                        <>
                          <IconCopy className="h-3.5 w-3.5" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* 历史分享记录 */}
                <div className="mt-8">
                  <h4 className="mb-4 text-sm font-semibold text-[#171717]">历史分享记录</h4>
                  {isLoadingShares ? (
                    <div className="flex justify-center py-4">
                      <IconLoader className="h-5 w-5 text-[#737373] animate-spin" />
                    </div>
                  ) : shares.length === 0 ? (
                    <p className="text-center text-sm text-[#a3a3a3]">暂无分享记录</p>
                  ) : (
                    <div className="space-y-3">
                      {shares.map((share) => (
                        <div key={share.shareId} className="flex items-center justify-between rounded-lg border border-black/[0.08] p-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#171717]">{share.title || '未命名对话'}</span>
                              <span className="inline-flex items-center gap-1 text-xs text-[#737373]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {share.viewCount}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                              <span>{share.expiresAt ? '限时' : '永久'}</span>
                              <span>·</span>
                              <span>{new Date(share.createdAt).toLocaleDateString('zh-CN')}</span>
                            </div>
                            <div className="mt-2 truncate text-xs text-[#4d4d4d]">{share.shareUrl}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(share.shareUrl).then(() => {
                                // 显示复制成功提示
                                alert('链接已复制');
                              });
                            }}
                            className="ml-3 shrink-0 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] transition hover:bg-[#f5f5f5]"
                          >
                            复制
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      setShareUrl(null);
                      setCopied(false);
                    }}
                    className="rounded-lg bg-[#171717] px-6 py-2 text-sm font-medium text-white transition hover:bg-black"
                  >
                    关闭
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
