'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Copy, X, Languages, Check } from 'lucide-react';

type TargetLanguage = 'zh' | 'en' | 'ko';

interface LanguageOption {
  code: TargetLanguage;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'zh', name: '中文', nativeName: '中文' },
  { code: 'en', name: '英文', nativeName: 'English' },
  { code: 'ko', name: '韩文', nativeName: '한국어' },
];

interface MessageTranslatorProps {
  content: string;
  className?: string;
}

// 简单的语言检测
function detectLanguage(text: string): TargetLanguage {
  // 简单的启发式检测
  const koreanRegex = /[\uac00-\ud7af]/;
  const chineseRegex = /[\u4e00-\u9fff]/;
  
  if (koreanRegex.test(text)) return 'ko';
  if (chineseRegex.test(text)) return 'zh';
  return 'en';
}

// 模拟翻译函数 - 实际项目中应该调用真实的翻译 API
async function translateText(text: string, targetLang: TargetLanguage): Promise<string> {
  // 这里应该调用真实的翻译 API，比如 Google Translate、DeepL 等
  // 为了演示，我们返回一个模拟的翻译结果
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return `[${targetLang.toUpperCase()} 翻译结果] ${text}`;
}

export default function MessageTranslator({ content, className = '' }: MessageTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('zh');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (!showMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);
  
  const handleTranslate = async (lang: TargetLanguage) => {
    setTargetLanguage(lang);
    setShowMenu(false);
    
    const detectedLang = detectLanguage(content);
    if (detectedLang === lang) {
      setTranslation('');
      setShowTranslation(true);
      return;
    }
    
    setIsTranslating(true);
    try {
      const result = await translateText(content, lang);
      setTranslation(result);
      setShowTranslation(true);
    } catch (error) {
      console.error('翻译失败:', error);
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translation);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };
  
  const handleClose = () => {
    setShowTranslation(false);
    setTranslation('');
  };
  
  const currentLangName = LANGUAGES.find(l => l.code === targetLanguage)?.nativeName || targetLanguage;
  const detectedLang = detectLanguage(content);
  const isSameLanguage = detectedLang === targetLanguage;
  
  return (
    <div className={className}>
      {/* 翻译按钮 */}
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]"
          title="翻译"
        >
          {isTranslating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Languages className="h-3 w-3" />
          )}
          翻译
        </button>
        
        {/* 语言选择菜单 */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-black/[0.08] bg-white dark:bg-[#262626] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
          >
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleTranslate(lang.code)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#171717] dark:text-white transition-colors hover:bg-[#fafafa] dark:hover:bg-[#3d3d3d]"
              >
                <span>{lang.name}</span>
                <span className="text-xs text-[#737373]">{lang.nativeName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 翻译结果 */}
      {showTranslation && (
        <div className="mt-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
          {/* 标题栏 */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-[#737373]" />
              <span className="text-xs font-medium text-[#171717]">
                {isSameLanguage ? '原文已是该语言' : `翻译为 ${currentLangName}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!isSameLanguage && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#737373] transition-colors hover:bg-[#e5e5e5] hover:text-[#171717]"
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-3 w-3 text-[#22c55e]" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      复制
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#737373] transition-colors hover:bg-[#e5e5e5] hover:text-[#171717]"
              >
                <X className="h-3 w-3" />
                关闭
              </button>
            </div>
          </div>
          
          {/* 分隔线 */}
          {!isSameLanguage && <div className="h-px bg-[#e5e5e5] mb-3" />}
          
          {/* 翻译内容 */}
          {!isSameLanguage && translation && (
            <div className="text-sm text-[#171717] whitespace-pre-wrap">
              {translation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
