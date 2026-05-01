'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettings } from '@/lib/settings';
import CodeBlock from './CodeBlock';
import MermaidRenderer from './MermaidRenderer';

interface MarkdownRendererProps {
  content: string;
}

const generateHeadingId = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
};

const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const baseStyles = {
  h1: 'text-2xl font-bold mt-6 mb-3',
  h2: 'text-xl font-semibold mt-5 mb-2',
  h3: 'text-lg font-semibold mt-4 mb-2',
  h4: 'text-base font-semibold mt-3 mb-1.5',
  h5: 'text-sm font-semibold mt-2.5 mb-1.5',
  h6: 'text-sm font-semibold mt-2 mb-1.5',
};

const createHeadingComponent = (level: number) => {
  return ({ children }: { children?: ReactNode }) => {
    const text = children ? String(children).trim() : '';
    const id = generateHeadingId(text);
    const Tag = headingTags[level - 1];
    
    return (
      <Tag id={`heading-${id}`} className={baseStyles[Tag]}>
        {children}
      </Tag>
    );
  };
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { settings } = useSettings();

  const headingComponents = {
    h1: createHeadingComponent(1),
    h2: createHeadingComponent(2),
    h3: createHeadingComponent(3),
    h4: createHeadingComponent(4),
    h5: createHeadingComponent(5),
    h6: createHeadingComponent(6),
  };

  return (
    <div className="prose prose-sm max-w-none text-[#171717] prose-p:my-1.5 prose-p:text-[#4d4d4d] prose-pre:my-3 prose-headings:scroll-mt-4 prose-headings:text-[#171717] prose-strong:text-[#171717] prose-li:text-[#4d4d4d] prose-code:rounded prose-code:border prose-code:border-[rgba(0,0,0,0.08)] prose-code:bg-[#fafafa] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:text-[#171717] prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-[#171717] prose-a:underline prose-a:decoration-neutral-400 prose-a:underline-offset-2 hover:prose-a:decoration-neutral-600">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...headingComponents,
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
    </div>
  );
}