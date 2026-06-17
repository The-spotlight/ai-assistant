'use client';

import { useEffect, useRef, useMemo } from 'react';
import type { Message } from 'ai';
import {
  calculateMessageCost,
  formatCost,
  formatTokens,
  getModelPricing,
} from '@/lib/model-pricing';

type MessageWithTokens = Message & {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt?: Date;
};

interface MessageStat {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost: number;
  cumulativeCost: number;
  index: number;
}

interface TokenStatsPanelProps {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
  modelId: string;
  totalTokens: number;
  totalCost: number;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconInfo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export default function TokenStatsPanel({
  visible,
  onClose,
  messages,
  modelId,
  totalTokens,
  totalCost,
  triggerRef,
}: TokenStatsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const modelPricing = getModelPricing(modelId);

  const messageStats = useMemo<MessageStat[]>(() => {
    const stats: MessageStat[] = [];
    let cumulativeCost = 0;

    messages.forEach((m, index) => {
      const msg = m as MessageWithTokens;
      if (msg.role !== 'user' && msg.role !== 'assistant') return;

      const hasTokenData =
        msg.promptTokens != null && msg.completionTokens != null;

      const cost = hasTokenData
        ? calculateMessageCost(msg.promptTokens!, msg.completionTokens!, modelId)
        : 0;

      if (hasTokenData || msg.role === 'assistant') {
        cumulativeCost += cost;
      }

      stats.push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        promptTokens: msg.promptTokens,
        completionTokens: msg.completionTokens,
        totalTokens: msg.totalTokens,
        cost,
        cumulativeCost,
        index,
      });
    });

    return stats.reverse();
  }, [messages, modelId]);

  const avgCostPerMessage = useMemo(() => {
    const messagesWithCost = messages.filter((m) => {
      const msg = m as MessageWithTokens;
      return (
        msg.role === 'assistant' &&
        msg.promptTokens != null &&
        msg.completionTokens != null
      );
    }).length;
    return messagesWithCost > 0 ? totalCost / messagesWithCost : 0;
  }, [messages, totalCost]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickOnPanel = panelRef.current?.contains(target);
      const isClickOnTrigger = triggerRef?.current?.contains(target);

      if (!isClickOnPanel && !isClickOnTrigger) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose, triggerRef]);

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-40 mt-2 w-[420px] max-w-[95vw] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-modal="true"
      aria-label="Token 消耗统计"
    >
      <div className="flex items-center justify-between border-b border-black/[0.08] bg-[#fafafa] px-4 py-3">
        <div className="flex items-center gap-2">
          <IconInfo className="h-4 w-4 text-[#171717]" />
          <h3 className="text-sm font-semibold text-[#171717]">消耗明细</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#737373] transition-colors hover:bg-[#ebebeb] hover:text-[#171717]"
          aria-label="关闭"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-black/[0.04] bg-white px-4 py-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="min-w-0">
            <div className="text-[10px] text-[#737373]">模型</div>
            <div className="mt-0.5 text-sm font-medium text-[#171717] truncate" title={modelPricing.label}>
              {modelPricing.label}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#737373]">总 Token</div>
            <div className="mt-0.5 text-sm font-medium text-[#171717]">
              {formatTokens(totalTokens)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#737373]">总费用</div>
            <div className="mt-0.5 text-sm font-medium text-[#171717]">
              {formatCost(totalCost)}
            </div>
          </div>
        </div>
        {avgCostPerMessage > 0 && (
          <div className="mt-3 flex items-center justify-center gap-1 rounded-md bg-[#fafafa] px-3 py-1.5">
            <span className="text-[10px] text-[#737373]">平均每条消息费用：</span>
            <span className="text-[11px] font-medium text-[#171717]">
              {formatCost(avgCostPerMessage)}
            </span>
          </div>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {messageStats.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[#a3a3a3]">
            暂无消息记录
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {messageStats.map((stat, listIndex) => (
              <div
                key={stat.id}
                className="px-4 py-2.5 hover:bg-[#fafafa]/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${
                        stat.role === 'user'
                          ? 'bg-[#171717] text-white'
                          : 'border border-black/[0.06] bg-[#f4f4f5] text-[#525252]'
                      }`}
                    >
                      {stat.role === 'user' ? '我' : 'AI'}
                    </span>
                    <span className="truncate text-xs text-[#4d4d4d]">
                      {stat.content.slice(0, 50)}
                      {stat.content.length > 50 ? '…' : ''}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#a3a3a3]">
                    #{messageStats.length - listIndex}
                  </span>
                </div>

                {stat.totalTokens != null && (
                  <div className="mt-1.5 ml-7">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-3 text-[10px]">
                        <span
                          className="inline-flex items-center gap-1"
                          title={`输入: ${stat.promptTokens} tokens`}
                        >
                          <span className="text-[#737373]">输入</span>
                          <span className="font-medium text-[#171717]">
                            {formatTokens(stat.promptTokens ?? 0)}
                          </span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1"
                          title={`输出: ${stat.completionTokens} tokens`}
                        >
                          <span className="text-[#737373]">输出</span>
                          <span className="font-medium text-[#171717]">
                            {formatTokens(stat.completionTokens ?? 0)}
                          </span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1"
                          title={`总计: ${stat.totalTokens} tokens`}
                        >
                          <span className="text-[#737373]">总计</span>
                          <span className="font-medium text-[#171717]">
                            {formatTokens(stat.totalTokens)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#737373]">
                        本条费用：<span className="font-medium text-[#171717]">{formatCost(stat.cost)}</span>
                      </span>
                      <span className="text-[10px] text-[#a3a3a3]">
                        累计：{formatCost(stat.cumulativeCost)}
                      </span>
                    </div>
                  </div>
                )}

                {stat.totalTokens == null && stat.role === 'assistant' && (
                  <div className="mt-1 ml-7 text-[10px] text-[#a3a3a3]">
                    暂无 token 数据
                  </div>
                )}

                {stat.role === 'user' && stat.totalTokens == null && (
                  <div className="mt-1 ml-7 text-[10px] text-[#a3a3a3]">
                    用户消息不单独计费
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-black/[0.08] bg-[#fafafa] px-4 py-2 text-center">
        <p className="text-[9px] text-[#a3a3a3]">
          按时间倒序排列 · 点击外部或按 Esc 关闭
        </p>
      </div>
    </div>
  );
}
