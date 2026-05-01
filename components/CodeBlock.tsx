'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  vs,
  dracula,
  prism,
  solarizedlight,
  tomorrow,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { useSettings } from '@/lib/settings';
import type { CodeHighlightKey } from '@/lib/settings';

const CODE_HIGHLIGHT_STYLES: Record<CodeHighlightKey, typeof oneDark> = {
  oneDark,
  vs,
  dracula,
  prism,
  solarizedlight,
  tomorrow,
};

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  python: ['def', 'import', 'from', 'print', 'return', 'if', 'else', 'elif', 'for', 'while', 'class', 'self', 'True', 'False', 'None', 'try', 'except', 'with', 'as', 'lambda'],
  javascript: ['function', 'const', 'let', 'var', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'class', 'this', 'new', 'async', 'await', 'try', 'catch', 'throw'],
  typescript: ['function', 'const', 'let', 'var', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'class', 'this', 'new', 'async', 'await', 'interface', 'type', 'extends'],
  java: ['public', 'private', 'protected', 'void', 'class', 'import', 'package', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'throw', 'new', 'this', 'static', 'final'],
  go: ['func', 'import', 'package', 'return', 'if', 'else', 'for', 'range', 'var', 'const', 'type', 'struct', 'interface', 'go', 'chan', 'select'],
  rust: ['fn', 'use', 'pub', 'struct', 'enum', 'impl', 'trait', 'if', 'else', 'for', 'while', 'match', 'return', 'let', 'const', 'mut', 'self', 'Self'],
  cpp: ['#include', 'using', 'namespace', 'class', 'public', 'private', 'protected', 'void', 'int', 'return', 'if', 'else', 'for', 'while', 'new', 'delete'],
  csharp: ['using', 'namespace', 'class', 'public', 'private', 'protected', 'void', 'int', 'return', 'if', 'else', 'for', 'while', 'new', 'this'],
  php: ['<?php', 'function', 'class', 'public', 'private', 'protected', 'return', 'if', 'else', 'for', 'while', 'echo', 'print', '$', 'new', 'this'],
  ruby: ['def', 'class', 'module', 'require', 'return', 'if', 'else', 'elsif', 'for', 'while', 'true', 'false', 'nil', 'self', 'begin', 'rescue'],
  bash: ['#!/bin/bash', 'echo', 'if', 'then', 'else', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'export', 'source', 'cd', 'ls'],
  sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'JOIN', 'ON', 'AND', 'OR', 'NOT'],
  html: ['<html', '<body', '<div', '<span', '<p', '<a', '<script', '</', 'class=', 'id=', 'src='],
  css: ['body', 'div', 'span', 'class', 'id', '{', '}', 'color', 'background', 'font', 'margin', 'padding', 'border'],
  json: ['{', '}', '[', ']', '"', ':'],
  yaml: ['-', ':', 'true', 'false', 'null'],
  markdown: ['# ', '## ', '### ', '* ', '- ', '```', '**', '*'],
};

function guessLanguage(code: string): string {
  let maxScore = 0;
  let guessedLang = 'plaintext';

  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (code.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      guessedLang = lang;
    }
  }

  return guessedLang;
}

interface CodeBlockProps {
  language: string;
  code: string;
  highlightStyle: CodeHighlightKey;
}

export default function CodeBlock({ language, code, highlightStyle }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { appearance } = useSettings();

  const detectedLanguage = language === 'plaintext' || !language ? guessLanguage(code) : language;
  const lines = code.split('\n');
  const shouldCollapse = lines.length > 20;
  const displayCode = shouldCollapse && !isExpanded ? lines.slice(0, 5).join('\n') + '\n...' : code;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    setError(false);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setError(false);
        timeoutRef.current = null;
      }, 2000);
    }
  }, [code]);

  // 深色模式下自动使用暗色代码高亮主题
  const effectiveHighlightStyle = appearance.darkMode
    ? (highlightStyle === 'vs' || highlightStyle === 'prism' || highlightStyle === 'solarizedlight' || highlightStyle === 'tomorrow'
      ? 'oneDark'
      : highlightStyle)
    : highlightStyle;
  
  const style = CODE_HIGHLIGHT_STYLES[effectiveHighlightStyle] || oneDark;

  return (
    <div className="my-4 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--theme-border, rgba(0,0,0,0.08))' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ backgroundColor: 'var(--theme-bg-tertiary, #fafafa)', borderColor: 'var(--theme-border, rgba(0,0,0,0.06))' }}>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--theme-text-muted, #a3a3a3)' }}>
          {detectedLanguage}
        </span>
        <div className="flex items-center gap-3">
          {shouldCollapse && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs transition-colors"
              style={{ color: 'var(--theme-text-muted, #a3a3a3)', hoverColor: 'var(--theme-text-primary, #171717)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-text-primary, #171717)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted, #a3a3a3)'}
            >
              {isExpanded ? '收起代码' : '展开完整代码'}
            </button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded transition-all duration-200"
                  style={{
                    color: error ? 'var(--destructive, #dc2626)' : copied ? 'var(--success, #22c55e)' : 'var(--theme-text-muted, #a3a3a3)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!error && !copied) {
                      e.currentTarget.style.color = 'var(--theme-text-primary, #171717)';
                      e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary, #f6f6f7)';
                    } else if (error) {
                      e.currentTarget.style.backgroundColor = 'var(--destructive-100, #fef2f2)';
                    } else if (copied) {
                      e.currentTarget.style.backgroundColor = 'var(--success-100, #f0fdf4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? '已复制' : error ? '复制失败' : '复制'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <SyntaxHighlighter
        style={style as any}
        language={detectedLanguage}
        PreTag="div"
        className="!m-0 !p-0 !border-0 text-sm"
        customStyle={{
          padding: '12px 16px',
        }}
      >
        {displayCode}
      </SyntaxHighlighter>
    </div>
  );
}