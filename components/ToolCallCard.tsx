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
    <div className="my-2 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span className="text-base">{emoji}</span>
        <span className="font-medium">{label}</span>
        <span className="text-gray-400 text-xs truncate flex-1 text-left">
          {formatArgs(args)}
        </span>
        <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 p-3 space-y-2">
          {/* Arguments */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">参数</div>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {result && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">结果</div>
              <div className="text-xs bg-white p-2 rounded border overflow-x-auto">
                {typeof parsedResult === 'object' && parsedResult !== null ? (
                  <pre>{JSON.stringify(parsedResult, null, 2)}</pre>
                ) : (
                  <p>{result}</p>
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
  const displayVal = typeof val === 'string' && val.length > 40 ? val.slice(0, 40) + '...' : String(val);
  return `${key}: ${displayVal}`;
}
