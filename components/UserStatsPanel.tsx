'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';
import { CloseButton } from '@/components/ui/Dialog';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Calendar, Clock, BarChart3, Loader2, User, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Info, Sparkles, RefreshCw } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { getModelShortName } from '@/lib/model-pricing';

type UserStats = {
  totalDays: number;
  lastActiveTime: string | null;
  last7DaysUsage: {
    date: string;
    conversationCount: number;
  }[];
};

interface HourlyActivity {
  hour: number;
  count: number;
}

interface DailyActivity {
  day: number;
  hours: HourlyActivity[];
}

interface ConversationPattern {
  avgMessagesPerConversation: number;
  avgConversationDurationMinutes: number;
  mostUsedModels: { modelId: string; count: number; percentage: number }[];
  totalConversations: number;
  totalMessages: number;
}

interface TrendComparison {
  currentMonth: {
    messages: number;
    tokens: number;
    conversations: number;
  };
  previousMonth: {
    messages: number;
    tokens: number;
    conversations: number;
  };
  messageChangePercent: number;
  tokenChangePercent: number;
  conversationChangePercent: number;
}

interface HabitInsight {
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  description: string;
}

interface HabitAnalysisData {
  hourlyActivity: HourlyActivity[];
  dailyActivity: DailyActivity[];
  conversationPattern: ConversationPattern;
  trendComparison: TrendComparison;
  insights: HabitInsight[];
}

interface UserStatsPanelProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'usage' | 'habits';

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

function formatHour(hour: number): string {
  if (hour === 0) return '0:00';
  if (hour < 12) return `${hour}:00`;
  if (hour === 12) return '12:00';
  return `${hour - 12}:00`;
}

function getHeatmapColor(value: number, maxValue: number): string {
  if (maxValue === 0) return '#f5f5f5';
  const ratio = value / maxValue;
  if (ratio === 0) return '#f5f5f5';
  if (ratio < 0.2) return '#fef3c7';
  if (ratio < 0.4) return '#fde68a';
  if (ratio < 0.6) return '#fcd34d';
  if (ratio < 0.8) return '#fbbf24';
  return '#f59e0b';
}

function getInsightIcon(type: string) {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />;
    case 'suggestion':
      return <Lightbulb className="h-4 w-4 text-[#3b82f6]" />;
    default:
      return <Info className="h-4 w-4 text-[#22c55e]" />;
  }
}

function getInsightBgColor(type: string): string {
  switch (type) {
    case 'warning':
      return 'bg-[#fffbeb] border-[#fef3c7]';
    case 'suggestion':
      return 'bg-[#eff6ff] border-[#dbeafe]';
    default:
      return 'bg-[#f0fdf4] border-[#dcfce7]';
  }
}

function getTrendIcon(change: number) {
  if (change > 0) {
    return <TrendingUp className="h-4 w-4 text-[#22c55e]" />;
  }
  if (change < 0) {
    return <TrendingDown className="h-4 w-4 text-[#ef4444]" />;
  }
  return <BarChart3 className="h-4 w-4 text-[#737373]" />;
}

function getTrendColor(change: number): string {
  if (change > 0) return 'text-[#22c55e]';
  if (change < 0) return 'text-[#ef4444]';
  return 'text-[#737373]';
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export default function UserStatsPanel({ visible, onClose }: UserStatsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('usage');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [habits, setHabits] = useState<HabitAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const deviceId = getOrCreateDeviceId();
      
      const [statsResponse, habitsResponse] = await Promise.all([
        fetch('/api/user-stats', {
          headers: { 'x-device-id': deviceId },
        }),
        fetch('/api/user-habits', {
          headers: { 'x-device-id': deviceId },
        }),
      ]);

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch user stats');
      }
      if (!habitsResponse.ok) {
        throw new Error('Failed to fetch user habits');
      }

      const statsData = await statsResponse.json();
      const habitsData = await habitsResponse.json();

      setStats(statsData);
      setHabits(habitsData);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('获取使用记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateAIReport = useCallback(async () => {
    setLoadingReport(true);
    setReportError(null);

    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/user-habits', {
        method: 'POST',
        headers: {
          'x-device-id': deviceId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generate-report' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI report');
      }

      const data = await response.json();
      setAiReport(data.report);
    } catch (err) {
      console.error('Error generating AI report:', err);
      setReportError('生成分析报告失败，请稍后重试');
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchStats();
      setAiReport(null);
      setActiveTab('usage');
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

  if (!visible) return null;

  const maxHourlyCount = habits?.hourlyActivity.reduce((max, h) => Math.max(max, h.count), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
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
            <span className="text-sm font-medium text-[#171717]">
              {activeTab === 'usage' ? '使用记录' : '习惯分析'}
            </span>
          </div>
          <CloseButton onClick={onClose} aria-label="关闭" />
        </div>

        <div className="flex border-b border-black/[0.06] bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'usage'
                ? 'text-[#171717] border-b-2 border-[#171717]'
                : 'text-[#a3a3a3] hover:text-[#737373]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>使用记录</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'habits'
                ? 'text-[#171717] border-b-2 border-[#171717]'
                : 'text-[#a3a3a3] hover:text-[#737373]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>习惯分析</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#d4d4d4] animate-spin mb-3" />
              <p className="text-sm font-medium text-[#737373]">正在加载数据...</p>
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
          ) : activeTab === 'usage' && stats ? (
            <div className="flex flex-col gap-4">
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
                  <h3 className="text-sm font-medium text-[#171717]">近7天使用情况</h3>
                </div>

                <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.last7DaysUsage} margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fill: '#737373', fontSize: 11 }}
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
                        formatter={(value: unknown) => [`${value as number} 条消息`, '会话数']}
                        labelFormatter={(label: unknown) => formatDate(label as string)}
                      />
                      <Bar
                        dataKey="conversationCount"
                        fill="#171717"
                        radius={[4, 4, 0, 0]}
                        label={{ position: 'top', formatter: (label: any) => String(label), fontSize: 11 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 pt-3 border-t border-[#e5e5e5]">
                    <div className="flex items-center justify-between text-xs text-[#737373]">
                      <span>总计会话数: {stats.last7DaysUsage.reduce((sum, d) => sum + d.conversationCount, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {habits && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-[#171717]" />
                    <h3 className="text-sm font-medium text-[#171717]">快速洞察</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {habits.insights.slice(0, 3).map((insight, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getInsightBgColor(insight.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[#171717] mb-0.5">{insight.title}</div>
                            <div className="text-[11px] text-[#525252] leading-relaxed">{insight.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'habits' && habits ? (
            <div className="flex flex-col gap-5">
              {!aiReport && (
                <button
                  type="button"
                  onClick={generateAIReport}
                  disabled={loadingReport}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#171717] text-white rounded-xl text-sm font-medium hover:bg-[#404040] transition-colors disabled:opacity-50"
                >
                  {loadingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>AI 正在分析您的使用习惯...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>生成 AI 分析报告</span>
                    </>
                  )}
                </button>
              )}

              {reportError && (
                <div className="p-3 bg-[#fef2f2] border border-[#fee2e2] rounded-lg">
                  <p className="text-xs text-[#dc2626]">{reportError}</p>
                </div>
              )}

              {aiReport && (
                <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#f59e0b]" />
                      <h3 className="text-sm font-medium text-[#171717]">AI 个性化分析报告</h3>
                    </div>
                    <button
                      type="button"
                      onClick={generateAIReport}
                      disabled={loadingReport}
                      className="p-1.5 text-[#a3a3a3] hover:text-[#171717] hover:bg-[#e5e5e5] rounded-lg transition-colors"
                      title="重新生成"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingReport ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="text-sm">
                    <MarkdownRenderer content={aiReport} />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-[#171717]" />
                  <h3 className="text-sm font-medium text-[#171717]">活跃时段分析</h3>
                </div>
                <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                  <div className="mb-3">
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={habits.hourlyActivity} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <XAxis
                          dataKey="hour"
                          tickFormatter={formatHour}
                          tick={{ fill: '#737373', fontSize: 9 }}
                          axisLine={{ stroke: '#e5e5e5' }}
                          tickLine={{ stroke: '#e5e5e5' }}
                          interval={3}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: unknown) => [`${value as number} 条消息`, '消息数']}
                          labelFormatter={(hour: unknown) => `${hour as number}:00 - ${(hour as number) + 1}:00`}
                        />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                          {habits.hourlyActivity.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getHeatmapColor(entry.count, maxHourlyCount)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-1 mb-3">
                    {habits.hourlyActivity.map((hourly, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded flex items-center justify-center"
                        style={{ backgroundColor: getHeatmapColor(hourly.count, maxHourlyCount) }}
                        title={`${hourly.hour}:00 - ${hourly.hour + 1}:00: ${hourly.count} 条消息`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#737373]">
                    <span>低</span>
                    <div className="flex gap-1">
                      {['#f5f5f5', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b'].map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span>高</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-[#171717]" />
                  <h3 className="text-sm font-medium text-[#171717]">对话模式分析</h3>
                </div>
                <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-[#e5e5e5]">
                      <div className="text-xl font-bold text-[#171717]">
                        {habits.conversationPattern.avgMessagesPerConversation}
                      </div>
                      <div className="text-[10px] text-[#737373]">平均每轮消息数</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-[#e5e5e5]">
                      <div className="text-xl font-bold text-[#171717]">
                        {habits.conversationPattern.avgConversationDurationMinutes}
                      </div>
                      <div className="text-[10px] text-[#737373]">平均会话时长（分钟）</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-[#e5e5e5]">
                      <div className="text-xl font-bold text-[#171717]">
                        {habits.conversationPattern.totalConversations}
                      </div>
                      <div className="text-[10px] text-[#737373]">总会话数</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-[#e5e5e5]">
                      <div className="text-xl font-bold text-[#171717]">
                        {habits.conversationPattern.totalMessages}
                      </div>
                      <div className="text-[10px] text-[#737373]">总消息数</div>
                    </div>
                  </div>

                  {habits.conversationPattern.mostUsedModels.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-[#171717] mb-2">最常用模型</div>
                      <div className="flex flex-col gap-2">
                        {habits.conversationPattern.mostUsedModels.slice(0, 3).map((model, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-5 text-center">
                              <span className="text-xs font-medium text-[#737373]">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-[#171717]">
                                  {getModelShortName(model.modelId)}
                                </span>
                                <span className="text-[10px] text-[#737373]">
                                  {Math.round(model.percentage)}%
                                </span>
                              </div>
                              <div className="w-full bg-[#e5e5e5] rounded-full h-1.5">
                                <div
                                  className="bg-[#171717] h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(model.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-[#171717]" />
                  <h3 className="text-sm font-medium text-[#171717]">趋势对比</h3>
                </div>
                <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg border border-[#e5e5e5]">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {getTrendIcon(habits.trendComparison.messageChangePercent)}
                        <span className={`text-xs font-medium ${getTrendColor(habits.trendComparison.messageChangePercent)}`}>
                          {habits.trendComparison.messageChangePercent > 0 ? '+' : ''}
                          {habits.trendComparison.messageChangePercent}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-[#171717]">
                        {habits.trendComparison.currentMonth.messages}
                      </div>
                      <div className="text-[10px] text-[#737373]">本月消息</div>
                      <div className="text-[9px] text-[#a3a3a3]">
                        上月: {habits.trendComparison.previousMonth.messages}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-white rounded-lg border border-[#e5e5e5]">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {getTrendIcon(habits.trendComparison.tokenChangePercent)}
                        <span className={`text-xs font-medium ${getTrendColor(habits.trendComparison.tokenChangePercent)}`}>
                          {habits.trendComparison.tokenChangePercent > 0 ? '+' : ''}
                          {habits.trendComparison.tokenChangePercent}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-[#171717]">
                        {formatTokens(habits.trendComparison.currentMonth.tokens)}
                      </div>
                      <div className="text-[10px] text-[#737373]">本月 Token</div>
                      <div className="text-[9px] text-[#a3a3a3]">
                        上月: {formatTokens(habits.trendComparison.previousMonth.tokens)}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-white rounded-lg border border-[#e5e5e5]">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {getTrendIcon(habits.trendComparison.conversationChangePercent)}
                        <span className={`text-xs font-medium ${getTrendColor(habits.trendComparison.conversationChangePercent)}`}>
                          {habits.trendComparison.conversationChangePercent > 0 ? '+' : ''}
                          {habits.trendComparison.conversationChangePercent}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-[#171717]">
                        {habits.trendComparison.currentMonth.conversations}
                      </div>
                      <div className="text-[10px] text-[#737373]">本月会话</div>
                      <div className="text-[9px] text-[#a3a3a3]">
                        上月: {habits.trendComparison.previousMonth.conversations}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-[#171717]" />
                  <h3 className="text-sm font-medium text-[#171717]">使用洞察</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {habits.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getInsightBgColor(insight.type)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#171717] mb-0.5">{insight.title}</div>
                          <div className="text-[11px] text-[#525252] leading-relaxed">{insight.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
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
