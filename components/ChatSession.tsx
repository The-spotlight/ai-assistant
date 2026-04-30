'use client';

import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ToolCallCard from '@/components/ToolCallCard';
import SkillPanel from '@/components/SkillPanel';
import QuickCommandPanel from '@/components/QuickCommandPanel';
import TokenStatsPanel from '@/components/TokenStatsPanel';
import ShareModal from '@/components/ShareModal';
import ShareHistory from '@/components/ShareHistory';
import { Button } from '@/components/ui/Button';
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
import type { QuickCommand, CustomCommand } from '@/lib/tools/quick-commands';
import { useSettings, FONT_SIZES, BUBBLE_STYLES, PRESET_GRADIENTS, IMAGE_DISPLAY_MODES, loadCustomCommands, type TimestampFormatKey, type SendShortcutKey, getCustomModelById, decryptApiKey } from '@/lib/settings';
import { useSpeech } from '@/lib/speech';
import {
  RefreshCw,
  Bookmark,
  Edit3,
  Check,
  X,
  Trash2,
  MoreVertical,
  Download,
  Share2,
  Copy,
  Loader2,
  Send,
  ChevronDown,
  Reply,
  FolderOpen,
  Maximize2,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from 'lucide-react';
import { useMessageFeedback, MessageFeedbackButton } from '@/components/MessageFeedback';
import DateSeparator, { isSameDay } from '@/components/DateSeparator';
import { saveDraft, loadDraft, clearDraft, addToHistory, getHistory } from '@/lib/draft-history';

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
  showDateSeparator?: boolean;
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
  onToggleImmersiveMode?: () => void;
  isImmersiveMode?: boolean;
};

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
  onToggleImmersiveMode,
  isImmersiveMode = false,
}: ChatSessionProps) {
  const { settings, themeColors, behavior, model, keyboardShortcuts } = useSettings();
  const {
    isPlaying,
    isPaused,
    currentMessageId,
    currentCharIndex,
    speak,
    pause,
    resume,
    stop,
  } = useSpeech();
  const bubbleStyle = BUBBLE_STYLES[settings.bubbleStyle];
  const fontSizeConfig = FONT_SIZES[settings.fontSize];

  const getChatBackgroundStyle = (): React.CSSProperties => {
    const bg = settings.background;
    switch (bg.type) {
      case 'solid':
        return { backgroundColor: bg.solidColor };
      case 'gradient':
        const gradient = PRESET_GRADIENTS.find(g => g.id === bg.gradientId);
        return { background: gradient?.value || '#ffffff' };
      case 'image':
        if (bg.imageUrl) {
          const modeConfig = IMAGE_DISPLAY_MODES[bg.imageMode];
          return {
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: modeConfig.size,
            backgroundPosition: modeConfig.position,
            backgroundRepeat: modeConfig.repeat,
          };
        }
        return { backgroundColor: '#ffffff' };
      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  const replyingToRef = useRef<ReplyInfo | null>(null);

  const chatBody = useMemo(() => {
    const currentModelId = model.defaultModel || modelId;
    const body: Record<string, unknown> = {
      model: currentModelId,
      conversationId,
      deviceId,
      temperature: model.temperature,
      maxTokens: model.maxTokens,
      streaming: model.streaming,
    };

    if (currentModelId.startsWith('custom_')) {
      const customModel = getCustomModelById(currentModelId);
      if (customModel) {
        body.customModelConfig = {
          baseUrl: customModel.baseUrl,
          apiKey: decryptApiKey(customModel.encryptedApiKey),
          modelId: customModel.modelId,
          provider: customModel.provider,
        };
      }
    }

    return body;
  }, [model.defaultModel, modelId, conversationId, deviceId, model.temperature, model.maxTokens, model.streaming]);

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
    body: chatBody,
    headers: { 'X-Device-Id': deviceId },
    onError: (error) => {
      console.error('[ChatSession] API 调用错误:', error);
    },
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const currentInputRef = useRef<string>('');
  const isBrowsingHistoryRef = useRef<boolean>(false);
  const statsTriggerRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [showTokenStats, setShowTokenStats] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 分享相关状态
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareHistory, setShowShareHistory] = useState(false);

  // 自定义指令列表 - 使用初始化函数同步加载
  const [customCommands, setCustomCommands] = useState<CustomCommand[]>(() => {
    if (typeof window !== 'undefined') {
      return loadCustomCommands();
    }
    return [];
  });

  // 快捷指令相关状态
  const [matchingSystemCommands, setMatchingSystemCommands] = useState<QuickCommand[]>([]);
  const [matchingCustomCommands, setMatchingCustomCommands] = useState<CustomCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const showQuickCommands = matchingSystemCommands.length > 0 || matchingCustomCommands.length > 0;

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

  // 消息反馈相关状态（使用组件化的hook）
  const { feedbackMap, handleLike, handleDislike, handleUndoDislike } = useMessageFeedback(deviceId);

  // 历史消息相关状态
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalInput, setOriginalInput] = useState('');

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

  // 复制分享链接
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  const handleCopyHistoryShareUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(url);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('复制链接失败:', error);
    }
  }, []);

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

  // 处理系统快捷指令选择
  const handleSystemCommandSelect = useCallback((command: QuickCommand) => {
    setInput(`/${command.command} `);
    setMatchingSystemCommands([]);
    setMatchingCustomCommands([]);
    setSelectedCommandIndex(0);
    inputRef.current?.focus();
  }, [setInput]);

  // 处理自定义指令选择
  const handleCustomCommandSelect = useCallback((command: CustomCommand) => {
    append({ role: 'user', content: command.prompt });
    setInput('');
    currentInputRef.current = '';
    isBrowsingHistoryRef.current = false;
    setHistoryIndex(-1);
    setMatchingSystemCommands([]);
    setMatchingCustomCommands([]);
    setSelectedCommandIndex(0);
    setReplyingTo(null);
    replyingToRef.current = null;
  }, [append, setInput]);

  // 自定义输入处理，同步更新 ref
  const handleCustomInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    currentInputRef.current = newValue;
    handleInputChange(e);
    
    // 如果正在浏览历史且输入内容变化（不是通过历史导航），重置历史状态
    if (isBrowsingHistoryRef.current && historyIndex !== -1) {
      const prevHistoryValue = historyIndex >= 0 && historyIndex < messageHistory.length 
        ? messageHistory[historyIndex] 
        : '';
      if (newValue !== prevHistoryValue || newValue === '') {
        isBrowsingHistoryRef.current = false;
        setHistoryIndex(-1);
      }
    }
  }, [handleInputChange, historyIndex, messageHistory]);

  // 监听输入变化，更新匹配的快捷指令
  useEffect(() => {
    const { systemCommands, customCommands: matchedCustomCommands } = getMatchingCommands(input, customCommands);
    setMatchingSystemCommands(systemCommands);
    setMatchingCustomCommands(matchedCustomCommands);
    const totalCommands = systemCommands.length + matchedCustomCommands.length;
    if (totalCommands > 0 && selectedCommandIndex >= totalCommands) {
      setSelectedCommandIndex(0);
    }
  }, [input, customCommands, selectedCommandIndex]);

  // 组件挂载时加载草稿和历史消息
  useEffect(() => {
    const draft = loadDraft(conversationId);
    if (draft && !input) {
      setInput(draft);
    }
    const history = getHistory(conversationId);
    setMessageHistory(history);
  }, [conversationId, input, setInput]);

  // 监听输入变化，自动保存草稿
  useEffect(() => {
    if (input && !showQuickCommands) {
      saveDraft(conversationId, input);
    }
  }, [input, conversationId, showQuickCommands]);

  // 自定义表单提交处理
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 解析快捷指令
    const { systemCommand, customCommand, argument } = parseQuickCommand(input, customCommands);
    
    // 保存引用信息，然后清除 UI 状态
    const hasReply = !!replyingToRef.current;
    
    if (systemCommand && argument !== null) {
      // 如果是有效的系统快捷指令且有参数（有空格），即使参数为空字符串也允许提交
      // 这样用户可以搜索空格或其他特殊字符
      const prompt = generateQuickCommandPrompt(systemCommand, argument);
      append({ role: 'user', content: prompt });
      setInput('');
      clearDraft(conversationId);
      addToHistory(conversationId, prompt);
      setHistoryIndex(-1);
      // 提交后清除引用状态
      setReplyingTo(null);
      replyingToRef.current = null;
    } else if (customCommand) {
      // 如果是自定义指令，直接发送预设提示词
      append({ role: 'user', content: customCommand.prompt });
      setInput('');
      clearDraft(conversationId);
      addToHistory(conversationId, customCommand.prompt);
      setHistoryIndex(-1);
      setReplyingTo(null);
      replyingToRef.current = null;
    } else if (systemCommand && argument === null) {
      // 如果有系统指令但没有参数（没有空格，如 /搜索），不提交，等待用户输入参数
      return;
    } else {
      // 正常提交
      handleSubmit(e);
      clearDraft(conversationId);
      addToHistory(conversationId, input);
      setHistoryIndex(-1);
      // 提交后清除引用状态
      // 注意：这里需要延迟一点，确保 useChat 已经读取了 body 中的引用信息
      setTimeout(() => {
        setReplyingTo(null);
        replyingToRef.current = null;
      }, 0);
    }
  }, [input, customCommands, append, setInput, handleSubmit, generateQuickCommandPrompt, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 快捷指令导航
    if (showQuickCommands) {
      const totalCommands = matchingSystemCommands.length + matchingCustomCommands.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => 
          prev < totalCommands - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => 
          prev > 0 ? prev - 1 : totalCommands - 1
        );
        return;
      }
      if (e.key === 'Enter' && totalCommands > 0) {
        e.preventDefault();
        if (selectedCommandIndex < matchingSystemCommands.length) {
          const selectedCmd = matchingSystemCommands[selectedCommandIndex];
          if (selectedCmd) {
            handleSystemCommandSelect(selectedCmd);
          }
        } else {
          const selectedCmd = matchingCustomCommands[selectedCommandIndex - matchingSystemCommands.length];
          if (selectedCmd) {
            handleCustomCommandSelect(selectedCmd);
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMatchingSystemCommands([]);
        setMatchingCustomCommands([]);
        return;
      }
    }

    // 历史消息切换（输入框为空时）
    if (!showQuickCommands && !currentInputRef.current.trim()) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (messageHistory.length > 0) {
          if (historyIndex < messageHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(messageHistory[newIndex]);
            currentInputRef.current = messageHistory[newIndex];
            isBrowsingHistoryRef.current = true;
          }
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex >= 0) {
          if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInput('');
            currentInputRef.current = '';
            isBrowsingHistoryRef.current = false;
          } else {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(messageHistory[newIndex]);
            currentInputRef.current = messageHistory[newIndex];
            isBrowsingHistoryRef.current = true;
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setHistoryIndex(-1);
        setInput('');
        return;
      }
    }

    // 发送快捷键处理
    const isEnter = e.key === 'Enter';
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShiftPressed = e.shiftKey;
    const isAltPressed = e.altKey;
    
    // 构建当前按下的快捷键字符串
    let currentShortcut = '';
    if (isCtrlOrCmd) currentShortcut += 'Ctrl+';
    if (isShiftPressed) currentShortcut += 'Shift+';
    if (isAltPressed) currentShortcut += 'Alt+';
    currentShortcut += e.key.toUpperCase();

    // 检查是否匹配发送消息的快捷键
    if (currentShortcut === keyboardShortcuts.sendMessage && input.trim() && !isLoading) {
      e.preventDefault();
      handleFormSubmit(e);
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
  const chatBackgroundStyle = getChatBackgroundStyle();

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.06)]"
      style={chatBackgroundStyle}
    >
      {/* 顶部状态栏：显示 token 和费用 */}
      {messages.length > 0 && behavior.showTokenStats && (
        <div className="relative shrink-0 border-b border-white/20 bg-white/60 backdrop-blur-xl px-4 py-2 text-xs text-[#737373]">
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
              <div className="flex items-center gap-1" ref={menuContainerRef}>
                {onToggleImmersiveMode && !isImmersiveMode && (
                  <button
                    type="button"
                    onClick={onToggleImmersiveMode}
                    title="沉浸模式"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-white/40 transition-all duration-300 ease-in-out"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>
                )}
                <div
                  onClick={() => setShowMenu(!showMenu)}
                  title="更多选项"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-white/40 cursor-pointer transition-all duration-300 ease-in-out"
                >
                  <MoreVertical className="h-5 w-5" />
                </div>

                {/* 下拉菜单 */}
                {showMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareModal(true);
                        setShowMenu(false);
                      }}
                      disabled={messages.length === 0}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#171717] transition-colors hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="h-4 w-4 text-[#737373]" />
                      <span>分享</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareHistory(true);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#171717] transition-colors hover:bg-[#fafafa]"
                    >
                      <FolderOpen className="h-4 w-4 text-[#737373]" />
                      <span>分享记录</span>
                    </button>
                    <div className="h-px bg-black/[0.06]" />
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#171717] transition-colors hover:bg-[#fafafa]"
                    >
                      <Download className="h-4 w-4 text-[#737373]" />
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

          // 检查是否需要显示日期分割线
          // 优先使用后端返回的 showDateSeparator 字段（处理分页场景）
          // 前端判断作为回退（处理新发送的消息，还没从数据库加载的场景）
          const shouldShowDateSeparator = (() => {
            if (typeof msg.showDateSeparator === 'boolean') {
              return msg.showDateSeparator;
            }
            
            if (!msg.createdAt) return false;
            if (index === 0) return true;
            const prevMsg = messages[index - 1] as MessageWithTokens;
            if (!prevMsg.createdAt) return false;
            return !isSameDay(msg.createdAt, prevMsg.createdAt);
          })();

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
            <div key={m.id}>
              {shouldShowDateSeparator && !isImmersiveMode && msg.createdAt && (
                <DateSeparator 
                  date={msg.createdAt} 
                  isHighlighted={isHighlighted}
                />
              )}
              <div
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
                      <Bookmark className="h-4 w-4 text-[#f59e0b] fill-[#f59e0b]" />
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
                        <Reply className="h-3 w-3" />
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
                      <MarkdownRenderer 
                        content={m.content} 
                        isHighlighted={currentMessageId === m.id}
                        highlightCharIndex={currentMessageId === m.id ? currentCharIndex : -1}
                      />
                    ))
                  )}

                  {/* 编辑模式下的按钮 */}
                  {m.role === 'user' && editingMessageId === m.id && (
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="text-[12px] text-white/80 hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                        取消
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmEdit(m.id)}
                        disabled={!editingContent.trim()}
                        className="text-[12px]"
                      >
                        <Check className="h-3 w-3" />
                        确认
                      </Button>
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
                      {/* 朗读按钮 */}
                      {(() => {
                        const isThisMessagePlaying = currentMessageId === m.id;
                        const isThisMessagePaused = isThisMessagePlaying && isPaused;
                        const isThisMessageActive = isThisMessagePlaying;

                        if (isThisMessageActive) {
                          if (isThisMessagePaused) {
                            return (
                              <button
                                type="button"
                                onClick={() => resume()}
                                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors text-[#171717] bg-[#f5f5f5]`}
                                title="继续朗读"
                              >
                                <Play className="h-3 w-3" />
                                继续
                              </button>
                            );
                          } else {
                            return (
                              <button
                                type="button"
                                onClick={() => pause()}
                                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors text-[#171717] bg-[#f5f5f5]`}
                                title="暂停朗读"
                              >
                                <Pause className="h-3 w-3" />
                                暂停
                              </button>
                            );
                          }
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (isPlaying && !isThisMessagePlaying) {
                                stop();
                              }
                              speak(m.id, m.content);
                            }}
                            disabled={isGlobalRegenerating}
                            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors ${
                              isGlobalRegenerating
                                ? 'text-[#a3a3a3] cursor-not-allowed'
                                : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
                            }`}
                            title="朗读此消息"
                          >
                            <Volume2 className="h-3 w-3" />
                            朗读
                          </button>
                        );
                      })()}
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
                        <Reply className="h-3 w-3" />
                        引用
                      </button>
                      <MessageFeedbackButton
                        messageId={m.id}
                        conversationId={conversationId}
                        deviceId={deviceId}
                        feedback={feedbackMap[m.id] || { liked: false, disliked: false }}
                        onLike={handleLike}
                        onDislike={handleDislike}
                        onUndoDislike={handleUndoDislike}
                      />
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
                          <Bookmark className={`h-3 w-3 ${favoriteMessageIds.has(m.id) ? 'fill-[#f59e0b]' : ''}`} />
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
                          <RefreshCw className={`h-3 w-3 ${isThisMessageRegenerating ? 'animate-spin' : ''}`} />
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
                          <Reply className="h-3 w-3" />
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
                          <Edit3 className="h-3 w-3" />
                          编辑
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

      <div className="shrink-0 border-t border-white/20 bg-white/60 backdrop-blur-xl p-4 sm:p-5">
        <div className="relative mx-auto max-w-3xl">
          <SkillPanel
            visible={showSkills}
            onClose={() => setShowSkills(false)}
            onInsertPrompt={handleSkillInsert}
          />
          <QuickCommandPanel
            visible={showQuickCommands}
            systemCommands={matchingSystemCommands}
            customCommands={matchingCustomCommands}
            onSelectSystemCommand={handleSystemCommandSelect}
            onSelectCustomCommand={handleCustomCommandSelect}
            selectedIndex={selectedCommandIndex}
            onClose={() => {
              setMatchingSystemCommands([]);
              setMatchingCustomCommands([]);
            }}
          />

          {/* 引用预览 */}
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/60 backdrop-blur-sm px-3 py-2">
              <Reply className="h-4 w-4 text-[#737373]" />
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelReply}
                title="取消引用"
                className="text-[#a3a3a3] hover:text-[#737373]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            className="flex flex-col gap-3 rounded-lg bg-white/80 backdrop-blur-sm p-2 sm:flex-row sm:items-center sm:gap-2 sm:p-2"
            style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={handleCustomInputChange}
              onKeyDown={handleKeyDown}
              placeholder="有问题，尽管问… 输入 / 查看快捷指令"
              disabled={isLoading}
              className="min-h-[44px] flex-1 border-0 bg-transparent px-3 text-[15px] text-[#171717] placeholder:text-[#808080] focus:outline-none focus:ring-0 disabled:opacity-60"
            />
            <div className="flex items-center justify-end gap-1 sm:shrink-0">
              <button
                type="button"
                onClick={() => setShowSkills(!showSkills)}
                className="rounded px-3 py-2 text-sm text-[#4d4d4d] transition-colors hover:bg-white/40 hover:text-[#171717]"
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
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        conversationId={conversationId}
        deviceId={deviceId}
        messagesLength={messages.length}
      />

      {/* 分享记录模态框 */}
      <ShareHistory
        isOpen={showShareHistory}
        onClose={() => setShowShareHistory(false)}
        conversationId={conversationId}
        deviceId={deviceId}
        timestampFormat={behavior.timestampFormat}
        formatTime={formatTime}
      />

    </div>
  );
}
