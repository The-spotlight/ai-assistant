'use client';

import { useState } from 'react';

interface ToolCallProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
}

const TOOL_EMOJIS: Record<string, string> = {
  web_search: '🔍',
  code_execution: '💻',
  calculator: '🧮',
  text_analyzer: '📝',
  translator: '🌐',
};

const TOOL_LABELS: Record<string, string> = {
  web_search: '网络搜索',
  code_execution: '代码执行',
  calculator: '数学计算',
  text_analyzer: '文本分析',
  translator: '智能翻译',
};

export default function ToolCallCard({ toolName, args, result }: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const emoji = TOOL_EMOJIS[toolName] || '🔧';
  const label = TOOL_LABELS[toolName] || toolName;

  let parsedResult: unknown = null;
  try {
    parsedResult = result ? JSON.parse(result) : null;
  } catch {
    parsedResult = result;
  }

  return (
    <div className="mb-3 overflow-hidden rounded-linear border border-linear-border bg-linear-panel shadow-linear-sm">
      <div className="border-l-[3px] border-linear-brand pl-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 py-2.5 pr-3 text-left text-sm text-linear-tertiary transition-colors hover:bg-linear-deep/80"
        >
          <span className="text-base">{emoji}</span>
          <span className="font-medium text-linear-primary">{label}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-linear-quaternary">{formatArgs(args)}</span>
          <span
            className={`shrink-0 text-linear-quaternary transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-linear-border bg-linear-deep/50 p-3">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-linear-quaternary">
              参数
            </div>
            <pre className="overflow-x-auto rounded-linear border border-linear-border bg-linear-panel p-3 text-xs text-linear-primary">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {result && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-linear-quaternary">
                结果
              </div>
              <div className="overflow-x-auto rounded-linear border border-linear-border bg-linear-panel p-3 text-xs">
                {typeof parsedResult === 'object' && parsedResult !== null ? (
                  <pre className="text-linear-primary">{JSON.stringify(parsedResult, null, 2)}</pre>
                ) : (
                  <p className="whitespace-pre-wrap text-linear-primary">{result}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '无参数';
  const [key, val] = entries[0];
  const displayVal =
    typeof val === 'string' && val.length > 40 ? val.slice(0, 40) + '...' : String(val);
  return `${key}: ${displayVal}`;
}
