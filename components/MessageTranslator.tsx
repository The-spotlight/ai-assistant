'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Copy, X, Languages, Check } from 'lucide-react';
import { useMessageTranslateContext } from './MessageTranslateProvider';

type TargetLanguage = 'zh' | 'en' | 'ko';

interface LanguageOption {
  code: TargetLanguage;
  name: string;
  nativeName: string;
  deeplCode: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'zh', name: '中文', nativeName: '中文', deeplCode: 'ZH' },
  { code: 'en', name: '英文', nativeName: 'English', deeplCode: 'EN' },
  { code: 'ko', name: '韩文', nativeName: '한국어', deeplCode: 'KO' },
];

function detectLanguage(text: string): TargetLanguage {
  const koreanRegex = /[\uac00-\ud7af]/;
  const chineseRegex = /[\u4e00-\u9fff]/;

  if (koreanRegex.test(text)) return 'ko';
  if (chineseRegex.test(text)) return 'zh';
  return 'en';
}

async function translateWithDeepL(
  text: string,
  targetLang: TargetLanguage,
  authKey: string
): Promise<string> {
  const langConfig = LANGUAGES.find(l => l.code === targetLang);
  if (!langConfig) throw new Error('不支持的目标语言');

  const response = await fetch(
    `https://api-free.deepl.com/v2/translate?auth_key=${authKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        target_lang: langConfig.deeplCode,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepL API 错误: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.translations[0].text;
}

export function useMessageTranslator(content: string) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('zh');
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    const detectedLang = detectLanguage(content);
    if (detectedLang === lang) {
      setTranslation('');
      setShowTranslation(true);
      return;
    }

    setIsTranslating(true);
    try {
      const authKey = process.env.NEXT_PUBLIC_AUTH_KEY || '';
      const result = await translateWithDeepL(content, lang, authKey);
      setTranslation(result);
      setShowTranslation(true);
    } catch (err) {
      console.error('翻译失败:', err);
      setError(err instanceof Error ? err.message : '翻译失败');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleClose = useCallback(() => {
    setShowTranslation(false);
    setTranslation('');
    setError(null);
  }, []);

  const currentLangName = LANGUAGES.find(l => l.code === targetLanguage)?.nativeName || targetLanguage;
  const detectedLang = detectLanguage(content);
  const isSameLanguage = detectedLang === targetLanguage;

  return {
    isTranslating,
    showMenu,
    setShowMenu,
    showTranslation,
    translation,
    targetLanguage,
    error,
    currentLangName,
    isSameLanguage,
    menuRef,
    buttonRef,
    handleTranslate,
    handleClose,
  };
}

interface TranslateButtonProps {
  translator?: ReturnType<typeof useMessageTranslator>;
}

export function TranslateButton({ translator }: TranslateButtonProps) {
  const contextTranslator = useMessageTranslateContext();
  const t = translator || contextTranslator;
  
  const {
    isTranslating,
    showMenu,
    setShowMenu,
    menuRef,
    buttonRef,
    handleTranslate,
  } = t;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isTranslating}
        className="inline-flex items-center justify-center rounded px-1.5 py-1 text-[10px] transition-colors text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717] disabled:opacity-50"
        title="翻译"
      >
        {isTranslating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Languages className="h-3.5 w-3.5" />
        )}
      </button>

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
  );
}

interface TranslationResultProps {
  translator?: ReturnType<typeof useMessageTranslator>;
}

export function TranslationResult({ translator }: TranslationResultProps) {
  const contextTranslator = useMessageTranslateContext();
  const t = translator || contextTranslator;
  
  const {
    showTranslation,
    translation,
    currentLangName,
    isSameLanguage,
    error,
    handleClose,
  } = t;

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translation);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  if (!showTranslation) return null;

  return (
    <div className="mt-2 pt-2 border-t border-[#e5e5e5]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-[#737373]" />
          <span className="text-xs font-medium text-[#737373]">
            {isSameLanguage ? '原文已是该语言' : `翻译为 ${currentLangName}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isSameLanguage && !error && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#737373] transition-colors hover:bg-[#e5e5e5] hover:text-[#171717]"
            >
              {copySuccess ? (
                <>
                  <Check className="h-3 w-3 text-[#22c55e]" />
                  <span className="text-[#22c55e]">已复制</span>
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
          </button>
        </div>
      </div>

      {!isSameLanguage && translation && (
        <div className="text-sm text-[#525252] whitespace-pre-wrap">
          {translation}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500">
          翻译失败: {error}
        </div>
      )}
    </div>
  );
}