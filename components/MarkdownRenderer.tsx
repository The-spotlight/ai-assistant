'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none text-[#171717] prose-p:my-1.5 prose-p:text-[#4d4d4d] prose-pre:my-3 prose-headings:scroll-mt-4 prose-headings:text-[#171717] prose-strong:text-[#171717] prose-li:text-[#4d4d4d] prose-code:rounded prose-code:border prose-code:border-[rgba(0,0,0,0.08)] prose-code:bg-[#fafafa] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:text-[#171717] prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-[#0072f5] prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return !isInline ? (
              <SyntaxHighlighter
                style={oneDark as any}
                language={match[1]}
                PreTag="div"
                className="!my-3 !rounded-lg !border !border-[rgba(0,0,0,0.08)] !bg-[#1a1a1a] text-sm"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
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
                className="text-[#0072f5] hover:underline"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-[3px] border-[#0072f5]/50 pl-3 italic text-[#4d4d4d]">
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
