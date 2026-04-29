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

  const style = CODE_HIGHLIGHT_STYLES[highlightStyle] || oneDark;

  return (
    <div className="relative group !my-3">
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 rounded-t-lg border-b border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)]">
        <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">
          {detectedLanguage}
        </span>
        <div className="flex items-center gap-2">
          {shouldCollapse && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-[#6b7280] hover:text-[#171717] transition-colors"
            >
              {isExpanded ? '收起代码' : '展开完整代码'}
            </button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className={`p-1 rounded transition-all duration-200 ${
                    error
                      ? 'text-red-500 hover:bg-red-50'
                      : copied
                      ? 'text-green-500 hover:bg-green-50'
                      : 'text-[#737373] hover:text-[#171717] hover:bg-neutral-100'
                  }`}
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
        className="!my-0 !rounded-lg !border !rounded-t-none text-sm"
        customStyle={{
          borderColor: 'var(--theme-border, rgba(0,0,0,0.08))',
          marginTop: '28px',
        }}
      >
        {displayCode}
      </SyntaxHighlighter>
    </div>
  );
}