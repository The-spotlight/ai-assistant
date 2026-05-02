'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Plus, Languages, Copy, Loader2, Check, X } from 'lucide-react';
import { message } from 'antd';

export type SelectionAction = 'rewrite' | 'expand' | 'translate' | 'copy';

export interface TextSelectionState {
  isOpen: boolean;
  position: { x: number; y: number };
  selectedText: string;
  messageId: string | null;
  fullMessageContent: string;
}

export interface TextSelectionToolbarProps {
  selection: TextSelectionState;
  onAction: (action: SelectionAction) => void;
  onClose: () => void;
  isProcessing: boolean;
  processingAction: SelectionAction | null;
}

const TRANSLATE_PROMPT_ZH = `请将以下文本翻译成中文。如果已经是中文，保持原文不变。只输出翻译结果，不要解释：

`;

const TRANSLATE_PROMPT_EN = `Please translate the following text into English. If it's already in English, keep it as is. Only output the translation result, do not explain:

`;

function detectLanguage(text: string): 'zh' | 'en' {
  const chineseRegex = /[\u4e00-\u9fff]/;
  let chineseCount = 0;
  let totalCount = 0;
  
  for (const char of text) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      chineseCount++;
    }
    if (/[a-zA-Z\u4e00-\u9fff]/.test(char)) {
      totalCount++;
    }
  }
  
  if (totalCount === 0) return 'zh';
  return chineseCount / totalCount > 0.3 ? 'zh' : 'en';
}

export async function callTextAction(
  action: SelectionAction,
  selectedText: string,
  fullContent: string,
  customModelConfig?: {
    baseUrl: string;
    apiKey: string;
    modelId: string;
    provider?: string;
  }
): Promise<string> {
  let systemPrompt = '';
  let userPrompt = '';

  switch (action) {
    case 'rewrite':
      systemPrompt = `你是一个专业的文本改写助手。你的任务是将用户提供的文本用不同的方式重新表达，但保持完全相同的含义。

## 改写原则：
1. **保持原意**：不要改变原文的核心意思和信息
2. **换一种说法**：使用不同的词汇、句式或表达方式
3. **保持风格一致**：如果原文是正式的，改写后也要正式；如果原文是随意的，改写后也要随意
4. **质量相同或更好**：改写后的文本应该和原文一样好或者更好

## 输出要求：
- 只输出改写后的文本
- 不要添加任何解释、说明或"改写后："之类的前缀
- 不要输出原文`;
      userPrompt = `请改写以下文本，用不同的方式表达相同的意思：

"${selectedText}"`;
      break;

    case 'expand':
      systemPrompt = `你是一个专业的内容扩展助手。你的任务是对用户提供的文本进行详细补充和展开，让内容更加丰富和完整。

## 扩展原则：
1. **基于原文**：扩展内容必须与原文主题相关
2. **增加细节**：添加更多的具体信息、例子或解释
3. **深化理解**：帮助读者更好地理解原文的含义
4. **保持连贯**：扩展后的内容要自然流畅，与原文衔接良好

## 扩展策略：
- **如果是概念说明**：可以增加定义、背景、应用场景、实际例子
- **如果是步骤说明**：可以增加每个步骤的细节、注意事项、常见问题
- **如果是观点陈述**：可以增加论据、数据、对比分析
- **如果是简单描述**：可以增加更多的细节、感受、背景信息

## 输出要求：
- 只输出扩展后的完整文本
- 不要添加任何解释、说明或"扩展后："之类的前缀
- 确保扩展后的内容包含原文的核心意思`;
      userPrompt = `请对以下文本进行详细补充和展开：

"${selectedText}"

上下文背景（供参考）：
${fullContent.substring(0, 1000)}`;
      break;

    case 'translate':
      const lang = detectLanguage(selectedText);
      if (lang === 'zh') {
        systemPrompt = `你是一个专业的翻译助手。请将用户提供的中文文本翻译成自然流畅的英文。

## 翻译原则：
1. **准确传达**：保持原文的所有信息和含义
2. **自然流畅**：翻译后的英文要符合母语者的表达习惯
3. **保持风格**：保持原文的语气和风格
4. **专业术语**：如果有专业术语，使用正确的英文对应词

## 输出要求：
- 只输出翻译后的英文文本
- 不要添加任何解释、说明或"翻译："之类的前缀
- 如果原文已经是英文，直接返回原文`;
        userPrompt = `请将以下中文翻译成英文：

"${selectedText}"`;
      } else {
        systemPrompt = `你是一个专业的翻译助手。请将用户提供的英文文本翻译成自然流畅的中文。

## 翻译原则：
1. **准确传达**：保持原文的所有信息和含义
2. **自然流畅**：翻译后的中文要符合中文表达习惯
3. **保持风格**：保持原文的语气和风格
4. **专业术语**：如果有专业术语，使用正确的中文对应词

## 输出要求：
- 只输出翻译后的中文文本
- 不要添加任何解释、说明或"翻译："之类的前缀
- 如果原文已经是中文，直接返回原文`;
        userPrompt = `请将以下英文翻译成中文：

"${selectedText}"`;
      }
      break;

    case 'copy':
      return selectedText;
  }

  const response = await fetch('/api/text-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
      customModelConfig,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '操作失败，请稍后重试');
  }

  const data = await response.json();
  return data.result;
}

export default function TextSelectionToolbar({
  selection,
  onAction,
  onClose,
  isProcessing,
  processingAction,
}: TextSelectionToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(selection.position);

  useEffect(() => {
    if (!selection.isOpen || !toolbarRef.current) return;

    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let x = selection.position.x - toolbarRect.width / 2;
    const y = selection.position.y - toolbarRect.height - 8;

    if (x < 10) {
      x = 10;
    }
    if (x + toolbarRect.width > viewportWidth - 10) {
      x = viewportWidth - toolbarRect.width - 10;
    }

    setAdjustedPosition({ x, y: Math.max(10, y) });
  }, [selection.isOpen, selection.position]);

  useEffect(() => {
    if (!selection.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    const handleSelectionChange = () => {
      const currentSelection = window.getSelection();
      if (!currentSelection || currentSelection.toString().trim() === '') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [selection.isOpen, onClose]);

  if (!selection.isOpen) return null;

  const actions: { id: SelectionAction; label: string; icon: React.ReactNode }[] = [
    { id: 'rewrite', label: '重写', icon: <RotateCcw className="h-4 w-4" /> },
    { id: 'expand', label: '展开', icon: <Plus className="h-4 w-4" /> },
    { id: 'translate', label: '翻译', icon: <Languages className="h-4 w-4" /> },
    { id: 'copy', label: '复制', icon: <Copy className="h-4 w-4" /> },
  ];

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-xl border border-black/[0.08] bg-white/90 dark:bg-[#262626]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-1"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) => {
        const isProcessingThis = isProcessing && processingAction === action.id;
        const isDisabled = isProcessing && !isProcessingThis;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action.id)}
            disabled={isDisabled}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isProcessingThis
                ? 'text-[#f59e0b]'
                : 'text-[#525252] dark:text-[#a3a3a3] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#171717] dark:hover:text-white'
            } ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={action.label}
          >
            {isProcessingThis ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              action.icon
            )}
            <span className="text-xs">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface RewrittenContentState {
  originalText: string;
  newText: string;
  isShowingOriginal: boolean;
  action: SelectionAction;
}

export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelectionState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    selectedText: '',
    messageId: null,
    fullMessageContent: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<SelectionAction | null>(null);

  const showToolbar = useCallback((
    selectedText: string,
    position: { x: number; y: number },
    messageId: string,
    fullMessageContent: string
  ) => {
    if (!selectedText.trim()) return;
    
    setSelection({
      isOpen: true,
      position,
      selectedText: selectedText.trim(),
      messageId,
      fullMessageContent,
    });
  }, []);

  const closeToolbar = useCallback(() => {
    setSelection((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const startProcessing = useCallback((action: SelectionAction) => {
    setIsProcessing(true);
    setProcessingAction(action);
  }, []);

  const stopProcessing = useCallback(() => {
    setIsProcessing(false);
    setProcessingAction(null);
  }, []);

  return {
    selection,
    showToolbar,
    closeToolbar,
    isProcessing,
    processingAction,
    startProcessing,
    stopProcessing,
  };
}
