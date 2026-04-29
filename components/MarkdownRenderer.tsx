'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettings } from '@/lib/settings';
import CodeBlock from './CodeBlock';
import MermaidRenderer from './MermaidRenderer';

interface MarkdownRendererProps {
  content: string;
  isHighlighted?: boolean;
  highlightCharIndex?: number;
}

export default function MarkdownRenderer({ 
  content, 
  isHighlighted = false,
  highlightCharIndex = -1,
}: MarkdownRendererProps) {
  const { settings } = useSettings();

  return (
    <div 
      className={`prose prose-sm max-w-none text-[#171717] prose-p:my-1.5 prose-p:text-[#4d4d4d] prose-pre:my-3 prose-headings:scroll-mt-4 prose-headings:text-[#171717] prose-strong:text-[#171717] prose-li:text-[#4d4d4d] prose-code:rounded prose-code:border prose-code:border-[rgba(0,0,0,0.08)] prose-code:bg-[#fafafa] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:text-[#171717] prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-[#171717] prose-a:underline prose-a:decoration-neutral-400 prose-a:underline-offset-2 hover:prose-a:decoration-neutral-600 transition-all duration-300 ${
        isHighlighted 
          ? 'bg-[#fffbeb] rounded-lg p-2 -mx-2 ring-1 ring-[#fbbf24]' 
          : ''
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            
            if (!isInline && match[1] === 'mermaid') {
              return <MermaidRenderer code={String(children).replace(/\n$/, '')} />;
            }
            
            return !isInline ? (
              <CodeBlock
                language={match[1]}
                code={String(children).replace(/\n$/, '')}
                highlightStyle={settings.codeHighlight}
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
      {isHighlighted && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] text-[#d97706]">正在朗读...</span>
        </div>
      )}
    </div>
  );
}