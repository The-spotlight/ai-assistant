'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';
import { CloseButton } from '@/components/ui/Dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  Clock,
  BarChart3,
  Loader2,
  User,
  MessageSquare,
  Zap,
  DollarSign,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';
import { formatTokens, formatCost } from '@/lib/model-pricing';

type UserStats = {
  totalDays: number;
  lastActiveTime: string | null;
  last7DaysUsage: {
    date: string;
    conversationCount: number;
  }[];
  totalConversations: number;
  totalTokens: number;
  totalCost: number;
  last30DaysUsage: {
    date: string;
    tokens: number;
    conversations: number;
  }[];
  modelUsage: {
    modelId: string;
    label: string;
    count: number;
  }[];
  hourlyUsage: {
    hour: number;
    count: number;
    label: string;
  }[];
};

interface UserStatsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const COLORS = [
  '#171717',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '未知';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] rounded-xl">
      <div className="w-10 h-10 rounded-full bg-[#e5e5e5] animate-pulse mb-2" />
      <div className="h-6 w-16 bg-[#e5e5e5] rounded animate-pulse mb-1" />
      <div className="h-3 w-12 bg-[#e5e5e5] rounded animate-pulse" />
    </div>
  );
}

function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]"
      style={{ height }}
    >
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#d4d4d4] animate-spin" />
      </div>
    </div>
  );
}

export default function UserStatsPanel({ visible, onClose }: UserStatsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/user-stats', {
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('获取使用记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchStats();
    }
  }, [visible, fetchStats]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  const peakUsageHour = useMemo(() => {
    if (!stats?.hourlyUsage) return null;
    const max = stats.hourlyUsage.reduce((prev, curr) =>
      curr.count > prev.count ? curr : prev
    );
    return max;
  }, [stats]);

  const mostUsedModel = useMemo(() => {
    if (!stats?.modelUsage || stats.modelUsage.length === 0) return null;
    return stats.modelUsage.reduce((prev, curr) =>
      curr.count > prev.count ? curr : prev
    );
  }, [stats]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">使用统计</span>
          </div>
          <CloseButton onClick={onClose} aria-label="关闭" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <SkeletonChart height={220} />
              <SkeletonChart height={220} />
              <SkeletonChart height={220} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">{error}</p>
              <button
                type="button"
                onClick={fetchStats}
                className="mt-2 px-4 py-2 text-sm font-medium text-[#171717] bg-[#f5f5f5] rounded-lg hover:bg-[#e5e5e5] transition-colors"
              >
                重试
              </button>
            </div>
          ) : stats ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f0fdf4] text-[#22c55e] mb-2">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">
                    {formatLargeNumber(stats.totalConversations)}
                  </div>
                  <div className="text-xs text-[#737373]">总对话数</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eff6ff] text-[#3b82f6] mb-2">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">
                    {formatTokens(stats.totalTokens)}
                  </div>
                  <div className="text-xs text-[#737373]">总消耗 Token</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#fef3c7] text-[#f59e0b] mb-2">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">
                    {formatCost(stats.totalCost)}
                  </div>
                  <div className="text-xs text-[#737373]">总花费金额</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f0fdf4] text-[#22c55e] mb-2">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">{stats.totalDays}</div>
                  <div className="text-xs text-[#737373]">使用天数</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eff6ff] text-[#3b82f6] mb-2">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-[#171717] text-center">
                    {stats.lastActiveTime ? formatRelativeTime(stats.lastActiveTime) : '暂无记录'}
                  </div>
                  <div className="text-xs text-[#737373]">最近活跃</div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-[#171717]" />
                  <h3 className="text-sm font-medium text-[#171717]">近 30 天使用趋势</h3>
                </div>

                <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={stats.last30DaysUsage}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          const day = date.getDate();
                          if (day === 1 || day === 15 || day === 30) {
                            return `${date.getMonth() + 1}/${day}`;
                          }
                          return '';
                        }}
                        tick={{ fill: '#737373', fontSize: 11 }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={{ stroke: '#e5e5e5' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: '#737373', fontSize: 10 }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={{ stroke: '#e5e5e5' }}
                        tickFormatter={(value) => formatLargeNumber(value)}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#737373', fontSize: 10 }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={{ stroke: '#e5e5e5' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value, name) => {
                          const numValue = value as number;
                          if (name === 'tokens') {
                            return [formatTokens(numValue), 'Token 消耗'];
                          }
                          return [numValue, '对话数'];
                        }}
                        labelFormatter={(label) => `日期: ${formatDate(label as string)}`}
                      />
                      <Legend
                        formatter={(value) => {
                          if (value === 'tokens') return 'Token 消耗';
                          return '对话数';
                        }}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="tokens"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="conversations"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {stats.modelUsage.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <PieChartIcon className="h-4 w-4 text-[#171717]" />
                    <h3 className="text-sm font-medium text-[#171717]">模型使用占比</h3>
                    {mostUsedModel && (
                      <span className="text-xs text-[#737373] ml-auto">
                        最常用: {mostUsedModel.label}
                      </span>
                    )}
                  </div>

                  <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={stats.modelUsage}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="label"
                          label={(props) => {
                            const { payload, percent } = props as any;
                            if (!payload || payload.count === 0) return '';
                            const pct = percent ?? 0;
                            if (pct < 0.05) return '';
                            return `${(pct * 100).toFixed(0)}%`;
                          }}
                          labelLine={false}
                        >
                          {stats.modelUsage.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value, name, props) => {
                            const numValue = value as number;
                            const payload = (props as any).payload;
                            const total = stats.modelUsage.reduce((sum, m) => sum + m.count, 0);
                            const percent = total > 0 ? ((numValue / total) * 100).toFixed(1) : '0';
                            return [`${numValue} 次 (${percent}%)`, payload?.label || name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-[#171717]" />
                  <h3 className="text-sm font-medium text-[#171717]">活跃时段分布</h3>
                  {peakUsageHour && peakUsageHour.count > 0 && (
                    <span className="text-xs text-[#737373] ml-auto">
                      峰值: {peakUsageHour.label}
                    </span>
                  )}
                </div>

                <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={stats.hourlyUsage}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#737373', fontSize: 10 }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={{ stroke: '#e5e5e5' }}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fill: '#737373', fontSize: 10 }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={{ stroke: '#e5e5e5' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => {
                          const numValue = value as number;
                          return [`${numValue} 次`, '对话数'];
                        }}
                        labelFormatter={(label) => `时段: ${label}`}
                      />
                      <Bar
                        dataKey="count"
                        fill="#171717"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373]">暂无使用记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UserButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 h-8 rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors px-2"
      title="查看使用记录"
      aria-label="打开使用记录"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f5f5f5] text-[#525252]">
        <User className="h-3.5 w-3.5" />
      </div>
      <span className="text-xs font-medium">我的</span>
    </button>
  );
}
