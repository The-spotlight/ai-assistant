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
    <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']">
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
              className="rounded-lg my-2 text-sm"
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
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="border border-gray-300 bg-gray-100 px-3 py-1 text-left font-semibold">
              {children}
            </th>
          );
        },
        td({ children }) {
          return <td className="border border-gray-300 px-3 py-1">{children}</td>;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-blue-300 pl-3 italic text-gray-600 my-2">
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
