'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, X, BarChart3, RefreshCw } from 'lucide-react';
import type { ConversationSentiment, MessageSentiment, SentimentType } from '@/lib/sentiment-analysis';
import { getSentimentColor, getSentimentLabel } from '@/lib/sentiment-analysis';
import { cn } from '@/lib/utils';

interface SentimentSummaryCardProps {
  /** 情感分析结果 */
  sentimentData: ConversationSentiment;
  /** 是否正在分析中 */
  isAnalyzing?: boolean;
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

function getSentimentIcon(sentiment: SentimentType) {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="h-4 w-4" />;
    case 'neutral':
      return <Minus className="h-4 w-4" />;
    case 'negative':
      return <TrendingDown className="h-4 w-4" />;
  }
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

export default function SentimentSummaryCard({
  sentimentData,
  isAnalyzing = false,
  onClose,
  onReAnalyze,
  className,
}: SentimentSummaryCardProps) {
  const [showChart, setShowChart] = useState(true);

  const { summary, messageSentiments, analyzedAt } = sentimentData;

  const chartData: ChartDataPoint[] = messageSentiments.map((msg, index) => ({
    index: index + 1,
    score: msg.score,
    sentiment: msg.sentiment,
    messageNumber: `${index + 1}`,
  }));

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

  if (isAnalyzing) {
    return (
      <div
        className={cn(
          'mb-4 rounded-xl border border-[#fef3c7] bg-[#fffbeb] p-4 dark:border-[#92400e]/30 dark:bg-[#451a03]/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-[#f59e0b]" />
          <div>
            <p className="text-sm font-medium text-[#92400e] dark:text-[#fcd34d]">
              正在分析对话情感...
            </p>
            <p className="text-xs text-[#b45309] dark:text-[#fbbf24]">
              AI 正在分析每条消息的情感倾向
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-4 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-sm dark:border-white/10 dark:bg-[#262626]',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#a3a3a3]" />
          <span className="text-sm font-medium text-[#171717] dark:text-white">情感分析摘要</span>
          <span className="text-[10px] text-[#a3a3a3]">
            分析于 {formatTime(analyzedAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
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

      <div className="p-4">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-[#f0fdf4] p-3 text-center dark:bg-[#14532d]/30">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-[#22c55e]" />
              <span className="text-lg font-bold text-[#15803d] dark:text-[#4ade80]">
                {summary.positivePercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#166534] dark:text-[#86efac]">积极</p>
            <p className="text-[10px] text-[#15803d]/70 dark:text-[#4ade80]/70">
              {summary.positiveCount} 条
            </p>
          </div>

          <div className="rounded-lg bg-[#f5f5f5] p-3 text-center dark:bg-[#3d3d3d]/50">
            <div className="flex items-center justify-center gap-1">
              <Minus className="h-4 w-4 text-[#a3a3a3]" />
              <span className="text-lg font-bold text-[#525252] dark:text-[#d4d4d4]">
                {summary.neutralPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#525252] dark:text-[#a3a3a3]">中性</p>
            <p className="text-[10px] text-[#525252]/70 dark:text-[#a3a3a3]/70">
              {summary.neutralCount} 条
            </p>
          </div>

          <div className="rounded-lg bg-[#fef2f2] p-3 text-center dark:bg-[#7f1d1d]/30">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="h-4 w-4 text-[#ef4444]" />
              <span className="text-lg font-bold text-[#b91c1c] dark:text-[#f87171]">
                {summary.negativePercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#dc2626] dark:text-[#fca5a5]">消极</p>
            <p className="text-[10px] text-[#b91c1c]/70 dark:text-[#f87171]/70">
              {summary.negativeCount} 条
            </p>
          </div>
        </div>

        {chartData.length > 1 && showChart && (
          <div className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-[#a3a3a3]">情绪变化趋势</p>
              <button
                type="button"
                onClick={() => setShowChart(false)}
                className="text-[10px] text-[#a3a3a3] hover:text-[#525252] dark:hover:text-[#d4d4d4]"
              >
                隐藏图表
              </button>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="messageNumber"
                    tick={{ fontSize: 10, fill: '#a3a3a3' }}
                    axisLine={{ stroke: '#e5e5e5' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[-1, 1]}
                    tick={{ fontSize: 10, fill: '#a3a3a3' }}
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
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const color = getSentimentColor(payload.sentiment);
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={color}
                          stroke="white"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
                <span className="text-[10px] text-[#a3a3a3]">积极</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#a3a3a3]" />
                <span className="text-[10px] text-[#a3a3a3]">中性</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                <span className="text-[10px] text-[#a3a3a3]">消极</span>
              </div>
            </div>
          </div>
        )}

        {!showChart && chartData.length > 1 && (
          <button
            type="button"
            onClick={() => setShowChart(true)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs text-[#a3a3a3] hover:text-[#525252] hover:bg-[#f5f5f5] dark:hover:text-[#d4d4d4] dark:hover:bg-[#3d3d3d]"
          >
            <BarChart3 className="h-3 w-3" />
            显示情绪变化图表
          </button>
        )}
      </div>
    </div>
  );
}

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
