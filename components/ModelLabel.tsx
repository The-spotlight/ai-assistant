'use client';

import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/Tooltip';
import { getModelShortName, getModelFullName } from '@/lib/model-pricing';

const TOOL_EMOJIS: Record<string, string> = {
  web_search: '🔍',
  code_execution: '💻',
  calculator: '🧮',
  text_analyzer: '📝',
  translator: '🌐',
  weather: '🌤️',
};

const TOOL_LABELS: Record<string, string> = {
  web_search: '网络搜索',
  code_execution: '代码执行',
  calculator: '数学计算',
  text_analyzer: '文本分析',
  translator: '智能翻译',
  weather: '天气查询',
};

interface ModelLabelProps {
  modelId: string | null | undefined;
  toolInvocations?: Array<{
    toolName: string;
    args?: Record<string, unknown>;
    result?: unknown;
  }>;
}

export default function ModelLabel({ modelId, toolInvocations }: ModelLabelProps) {
  const shortName = getModelShortName(modelId);
  const fullName = getModelFullName(modelId);

  const uniqueTools = useMemo(() => {
    if (!toolInvocations || toolInvocations.length === 0) return [];
    const seen = new Set<string>();
    const tools: { name: string; emoji: string; label: string }[] = [];
    for (const inv of toolInvocations) {
      const toolName = inv.toolName;
      if (seen.has(toolName)) continue;
      seen.add(toolName);
      tools.push({
        name: toolName,
        emoji: TOOL_EMOJIS[toolName] || '🔧',
        label: TOOL_LABELS[toolName] || toolName,
      });
    }
    return tools;
  }, [toolInvocations]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {uniqueTools.length > 0 && (
          <div className="flex items-center gap-0.5">
            {uniqueTools.map((tool) => (
              <Tooltip key={tool.name}>
                <TooltipTrigger asChild>
                  <span className="text-sm cursor-default">{tool.emoji}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{tool.label}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center rounded-full bg-[#f5f5f5] dark:bg-[#3d3d3d] px-2 py-0.5 text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] cursor-default transition-colors hover:bg-[#e5e5e5] dark:hover:bg-[#4d4d4d]"
            >
              {shortName}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span>{fullName}</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
