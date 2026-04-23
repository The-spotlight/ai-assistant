'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const getButtonText = () => {
    if (copied) return '已复制';
    if (error) return '复制失败';
    return '复制';
  };

  const getButtonClasses = () => {
    let baseClasses = "absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded border transition-all duration-200 opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-1";
    
    if (error) {
      return `${baseClasses} bg-red-50 text-red-600 border-red-200 focus:ring-red-400`;
    }
    
    if (copied) {
      return `${baseClasses} bg-green-50 text-green-600 border-green-200 focus:ring-green-400`;
    }
    
    return `${baseClasses} bg-white text-[#737373] border-black/[0.08] hover:bg-[#fafafa] hover:text-[#171717] focus:ring-[#404040]/45`;
  };

  return (
    <div className="relative group !my-3">
      <button
        onClick={handleCopy}
        className={getButtonClasses()}
      >
        {getButtonText()}
      </button>
      <SyntaxHighlighter
        style={oneDark as any}
        language={language}
        PreTag="div"
        className="!my-0 !rounded-lg !border !border-[rgba(0,0,0,0.08)] !bg-[#1a1a1a] text-sm"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none text-[#171717] prose-p:my-1.5 prose-p:text-[#4d4d4d] prose-pre:my-3 prose-headings:scroll-mt-4 prose-headings:text-[#171717] prose-strong:text-[#171717] prose-li:text-[#4d4d4d] prose-code:rounded prose-code:border prose-code:border-[rgba(0,0,0,0.08)] prose-code:bg-[#fafafa] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:text-[#171717] prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-[#171717] prose-a:underline prose-a:decoration-neutral-400 prose-a:underline-offset-2 hover:prose-a:decoration-neutral-600">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return !isInline ? (
              <CodeBlock
                language={match[1]}
                code={String(children).replace(/\n$/, '')}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-[rgba(0,0,0,0.08)]">
                <table className="m-0 min-w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-[rgba(0,0,0,0.08)] bg-[#fafafa] px-3 py-2 text-left font-semibold text-[#171717]">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-[rgba(0,0,0,0.06)] px-3 py-2 text-[#4d4d4d]">{children}</td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#171717] underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-600"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-[3px] border-neutral-300 pl-3 italic text-[#4d4d4d]">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
