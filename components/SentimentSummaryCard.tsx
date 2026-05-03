'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, X, BarChart3, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { ConversationSentiment, SentimentType } from '@/lib/sentiment-analysis';
import { getSentimentColor, getSentimentLabel } from '@/lib/sentiment-analysis';
import { cn } from '@/lib/utils';

interface SentimentFloatingCardProps {
  /** 情感分析结果（分析完成后） */
  sentimentData?: ConversationSentiment | null;
  /** 是否正在分析中 */
  isAnalyzing?: boolean;
  /** 是否显示卡片 */
  visible?: boolean;
  /** 关闭卡片的回调 */
  onClose?: () => void;
  /** 重新分析的回调 */
  onReAnalyze?: () => void;
  /** 自定义类名 */
  className?: string;
}

interface ChartDataPoint {
  index: number;
  score: number;
  sentiment: SentimentType;
  messageNumber: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint;
    return (
      <div className="rounded-lg border border-black/[0.08] bg-white dark:border-white/10 dark:bg-[#262626] px-3 py-2 shadow-lg">
        <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
          消息 {data.messageNumber}
        </p>
        <p className="text-sm font-medium" style={{ color: getSentimentColor(data.sentiment) }}>
          {getSentimentLabel(data.sentiment)} ({data.score.toFixed(2)})
        </p>
      </div>
    );
  }
  return null;
}

export default function SentimentFloatingCard({
  sentimentData,
  isAnalyzing = false,
  visible = false,
  onClose,
  onReAnalyze,
  className,
}: SentimentFloatingCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showChart, setShowChart] = useState(true);

  // 当分析完成时，自动展开
  useEffect(() => {
    if (!isAnalyzing && sentimentData && visible) {
      setIsExpanded(true);
    }
  }, [isAnalyzing, sentimentData, visible]);

  if (!visible) return null;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // 分析中状态
  if (isAnalyzing) {
    return (
      <div
        className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-[#fef3c7] bg-[#fffbeb] px-4 py-3 shadow-lg dark:border-[#92400e]/30 dark:bg-[#451a03]',
          className
        )}
      >
        <RefreshCw className="h-5 w-5 animate-spin text-[#f59e0b]" />
        <div>
          <p className="text-sm font-medium text-[#92400e] dark:text-[#fcd34d]">
            正在分析对话情感...
          </p>
          <p className="text-xs text-[#b45309] dark:text-[#fbbf24]">
            AI 正在分析每条消息的情感倾向
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-lg text-[#b45309] hover:text-[#92400e] hover:bg-[#fef3c7] dark:text-[#fbbf24] dark:hover:text-[#fcd34d] dark:hover:bg-[#78350f]/30 transition-colors"
            title="关闭"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  // 没有数据时不显示
  if (!sentimentData) return null;

  const { summary, messageSentiments, analyzedAt } = sentimentData;

  const chartData: ChartDataPoint[] = messageSentiments.map((msg, index) => ({
    index: index + 1,
    score: msg.score,
    sentiment: msg.sentiment,
    messageNumber: `${index + 1}`,
  }));

  // 收起状态 - 只显示迷你条
  if (!isExpanded) {
    return (
      <div
        className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2 shadow-lg dark:border-white/10 dark:bg-[#262626]',
          className
        )}
      >
        <BarChart3 className="h-4 w-4 text-[#3b82f6]" />
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: getSentimentColor('positive') }}
          >
            {summary.positivePercentage.toFixed(0)}%
          </span>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: getSentimentColor('neutral') }}
          >
            {summary.neutralPercentage.toFixed(0)}%
          </span>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: getSentimentColor('negative') }}
          >
            {summary.negativePercentage.toFixed(0)}%
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] dark:hover:text-white dark:hover:bg-[#3d3d3d] transition-colors"
          title="展开"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // 展开状态 - 显示完整卡片
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 w-80 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-xl dark:border-white/10 dark:bg-[#262626]',
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#3b82f6]" />
          <span className="text-sm font-medium text-[#171717] dark:text-white">情感分析</span>
          <span className="text-[10px] text-[#a3a3a3]">
            {formatTime(analyzedAt)}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {onReAnalyze && (
            <button
              type="button"
              onClick={onReAnalyze}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] dark:hover:text-white dark:hover:bg-[#3d3d3d] transition-colors"
              title="重新分析"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] dark:hover:text-white dark:hover:bg-[#3d3d3d] transition-colors"
            title="收起"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] dark:hover:text-white dark:hover:bg-[#3d3d3d] transition-colors"
              title="关闭"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 统计数据 */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#f0fdf4] p-2.5 text-center dark:bg-[#14532d]/30">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-[#22c55e]" />
              <span className="text-base font-bold text-[#15803d] dark:text-[#4ade80]">
                {summary.positivePercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] text-[#166534] dark:text-[#86efac]">积极</p>
            <p className="text-[9px] text-[#15803d]/70 dark:text-[#4ade80]/70">
              {summary.positiveCount} 条
            </p>
          </div>

          <div className="rounded-lg bg-[#f5f5f5] p-2.5 text-center dark:bg-[#3d3d3d]/50">
            <div className="flex items-center justify-center gap-1">
              <Minus className="h-3.5 w-3.5 text-[#a3a3a3]" />
              <span className="text-base font-bold text-[#525252] dark:text-[#d4d4d4]">
                {summary.neutralPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] text-[#525252] dark:text-[#a3a3a3]">中性</p>
            <p className="text-[9px] text-[#525252]/70 dark:text-[#a3a3a3]/70">
              {summary.neutralCount} 条
            </p>
          </div>

          <div className="rounded-lg bg-[#fef2f2] p-2.5 text-center dark:bg-[#7f1d1d]/30">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-[#ef4444]" />
              <span className="text-base font-bold text-[#b91c1c] dark:text-[#f87171]">
                {summary.negativePercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] text-[#dc2626] dark:text-[#fca5a5]">消极</p>
            <p className="text-[9px] text-[#b91c1c]/70 dark:text-[#f87171]/70">
              {summary.negativeCount} 条
            </p>
          </div>
        </div>

        {/* 折线图 */}
        {chartData.length > 1 && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-[#a3a3a3]">情绪变化趋势</p>
              <button
                type="button"
                onClick={() => setShowChart(!showChart)}
                className="text-[10px] text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#d4d4d4]"
              >
                {showChart ? '隐藏图表' : '显示图表'}
              </button>
            </div>
            {showChart && (
              <>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis
                        dataKey="messageNumber"
                        tick={{ fontSize: 9, fill: '#a3a3a3' }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[-1, 1]}
                        tick={{ fontSize: 9, fill: '#a3a3a3' }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={false}
                        tickFormatter={(value) => {
                          if (value === 1) return '+1';
                          if (value === -1) return '-1';
                          if (value === 0) return '0';
                          return '';
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#525252"
                        strokeWidth={1.5}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          const color = getSentimentColor(payload.sentiment);
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={color}
                              stroke="white"
                              strokeWidth={1}
                            />
                          );
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                    <span className="text-[9px] text-[#a3a3a3]">积极</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#a3a3a3]" />
                    <span className="text-[9px] text-[#a3a3a3]">中性</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                    <span className="text-[9px] text-[#a3a3a3]">消极</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 微型情感指示点组件
 * 放在消息气泡右下角（时间戳旁边），6px 小圆点，带 tooltip
 */
interface SentimentDotIndicatorProps {
  sentiment: SentimentType | null;
  className?: string;
}

export function SentimentDotIndicator({
  sentiment,
  className,
}: SentimentDotIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!sentiment) return null;

  const color = getSentimentColor(sentiment);
  const label = getSentimentLabel(sentiment);

  return (
    <div className="relative inline-flex">
      <div
        className={cn(
          'h-1.5 w-1.5 rounded-full cursor-help transition-transform hover:scale-125',
          className
        )}
        style={{ backgroundColor: color }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={label}
      />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10">
          <div className="whitespace-nowrap rounded-lg bg-[#171717] px-2 py-1 text-[10px] text-white shadow-lg dark:bg-white dark:text-[#171717]">
            {label}
            <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-[#171717] dark:border-t-white" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @deprecated 使用 SentimentDotIndicator 替代
 */
export function SentimentIndicator({
  sentiment,
  className,
}: {
  sentiment: SentimentType | null;
  className?: string;
}) {
  if (!sentiment) return null;

  return (
    <div
      className={cn(
        'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
        className
      )}
      style={{
        backgroundColor: getSentimentColor(sentiment),
      }}
      title={getSentimentLabel(sentiment)}
    />
  );
}
