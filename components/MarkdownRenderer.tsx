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
    <div
      className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-p:text-linear-secondary prose-pre:my-3 prose-headings:scroll-mt-4 prose-headings:text-linear-primary prose-strong:text-linear-primary prose-li:text-linear-secondary prose-code:rounded prose-code:border prose-code:border-white/10 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:text-linear-brand-light prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-linear-brand prose-a:no-underline hover:prose-a:underline"
    >
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
                className="!my-3 !rounded-lg !border !border-white/10 !bg-[#0d0d0f] text-sm"
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
              <div className="my-3 overflow-x-auto rounded-linear border border-white/10">
                <table className="m-0 min-w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-white/10 bg-white/[0.04] px-3 py-2 text-left font-semibold text-linear-primary">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-white/[0.06] px-3 py-2 text-linear-secondary">{children}</td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-linear-brand hover:underline"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-[3px] border-linear-brand/60 pl-3 italic text-linear-tertiary">
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
