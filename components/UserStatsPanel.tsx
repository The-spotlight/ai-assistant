'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';
import { CloseButton } from '@/components/ui/Dialog';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { Calendar, Clock, BarChart3, Loader2, User, Activity, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';

type DailyActivity = {
  date: string;
  conversationCount: number;
  messageCount: number;
};

type MonthlyActivity = {
  month: string;
  conversationCount: number;
  messageCount: number;
};

type UserStats = {
  totalDays: number;
  lastActiveTime: string | null;
  last7DaysUsage: {
    date: string;
    conversationCount: number;
  }[];
  last365DaysActivity?: DailyActivity[];
  yearTotalConversations?: number;
  last12MonthsActivity?: MonthlyActivity[];
};

interface UserStatsPanelProps {
  visible: boolean;
  onClose: () => void;
}

type ActivityLevel = 0 | 1 | 2 | 3;

function getActivityLevel(conversationCount: number): ActivityLevel {
  if (conversationCount === 0) return 0;
  if (conversationCount <= 3) return 1;
  if (conversationCount <= 10) return 2;
  return 3;
}

const activityColors: Record<ActivityLevel, string> = {
  0: '#f5f5f5',
  1: '#bbf7d0',
  2: '#4ade80',
  3: '#16a34a',
};

const activityLabels: Record<ActivityLevel, string> = {
  0: '未使用',
  1: '低活跃度',
  2: '中活跃度',
  3: '高活跃度',
};

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

function formatChineseDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month} 月 ${day} 日`;
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const currentYear = new Date().getFullYear().toString();
  if (year === currentYear) {
    return `${parseInt(month)}月`;
  }
  return `${year}年${parseInt(month)}月`;
}

interface ContributionCalendarProps {
  activities: DailyActivity[];
  yearTotal: number;
}

function ContributionCalendar({ activities, yearTotal }: ContributionCalendarProps) {
  const weeks = useMemo(() => {
    const result: DailyActivity[][] = [];
    const sortedActivities = [...activities].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstDate = new Date(sortedActivities[0]?.date || Date.now());
    const firstDay = firstDate.getDay();

    const currentWeek: DailyActivity[] = [];
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: '', conversationCount: 0, messageCount: 0 });
    }

    for (const activity of sortedActivities) {
      const date = new Date(activity.date);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push([...currentWeek]);
        currentWeek.length = 0;
      }

      currentWeek.push(activity);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [activities]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const monthLabels = useMemo(() => {
    const labels: { month: string; column: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIdx) => {
      week.forEach((day, dayIdx) => {
        if (day.date) {
          const date = new Date(day.date);
          const month = date.getMonth();
          if (month !== lastMonth) {
            labels.push({
              month: `${month + 1}月`,
              column: weekIdx,
            });
            lastMonth = month;
          }
        }
      });
    });

    return labels;
  }, [weeks]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-[#171717]">
        今年共 <span className="font-bold text-[#16a34a]">{yearTotal}</span> 次对话
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          <div className="flex justify-end gap-1 mb-1">
            {monthLabels.map((label, idx) => (
              <span key={idx} className="text-[10px] text-[#737373] w-3 text-center">
                {label.month}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            <div className="flex flex-col gap-1 mr-1">
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className="h-3 flex items-center text-[10px] text-[#737373]"
                >
                  {idx % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {weekDays.map((_, dayIdx) => {
                    const day = week[dayIdx];
                    if (!day) {
                      return (
                        <div
                          key={dayIdx}
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: 'transparent' }}
                        />
                      );
                    }

                    const level = getActivityLevel(day.conversationCount);
                    const color = activityColors[level];

                    if (!day.date) {
                      return (
                        <div
                          key={dayIdx}
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: 'transparent' }}
                        />
                      );
                    }

                    return (
                      <Tooltip key={dayIdx}>
                        <TooltipTrigger asChild>
                          <div
                            className="w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-[#171717]/20 transition-all"
                            style={{ backgroundColor: color }}
                            title=""
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-center">
                          <p className="font-medium">{formatChineseDate(day.date)}</p>
                          <p className="text-[#737373]">
                            {day.conversationCount} 次对话，{day.messageCount} 条消息
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-[10px] text-[#737373]">少</span>
            {([0, 1, 2, 3] as ActivityLevel[]).map((level) => (
              <Tooltip key={level}>
                <TooltipTrigger asChild>
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: activityColors[level] }}
                  />
                </TooltipTrigger>
                <TooltipContent>{activityLabels[level]}</TooltipContent>
              </Tooltip>
            ))}
            <span className="text-[10px] text-[#737373]">多</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MonthlyChartProps {
  data: MonthlyActivity[];
}

function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: formatMonth(item.month),
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-white border border-black/[0.06] rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs font-medium text-[#171717]">{label}</p>
          <p className="text-xs text-[#737373]">{item.conversationCount} 次对话</p>
          <p className="text-xs text-[#737373]">{item.messageCount} 条消息</p>
        </div>
      );
    }
    return null;
  };

  const maxConversations = Math.max(...data.map((d) => d.conversationCount), 1);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 10, right: 5, left: 0, bottom: 30 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#737373', fontSize: 10 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={{ stroke: '#e5e5e5' }}
            angle={-45}
            textAnchor="end"
            height={45}
          />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
          <Bar dataKey="conversationCount" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => {
              const ratio = entry.conversationCount / maxConversations;
              let fill = '#bbf7d0';
              if (ratio > 0.66) fill = '#16a34a';
              else if (ratio > 0.33) fill = '#4ade80';
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 pt-2 border-t border-[#e5e5e5]">
        <div className="flex items-center justify-between text-xs text-[#737373]">
          <span>
            12 个月总计: {data.reduce((sum, d) => sum + d.conversationCount, 0)} 次对话
          </span>
        </div>
      </div>
    </div>
  );
}

type TabType = 'overview' | 'calendar';

export default function UserStatsPanel({ visible, onClose }: UserStatsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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
      setActiveTab('overview');
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

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '概览', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: 'calendar', label: '使用日历', icon: <Calendar className="h-3.5 w-3.5" /> },
  ];

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div
          ref={panelRef}
          className="mx-4 w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
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
              <span className="text-sm font-medium text-[#171717]">使用记录</span>
            </div>
            <CloseButton onClick={onClose} aria-label="关闭" />
          </div>

          <div className="flex border-b border-black/[0.06] bg-[#fafafa]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-[#171717]'
                    : 'text-[#a3a3a3] hover:text-[#737373]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#171717] rounded-full" />
                )}
              </button>
            ))}
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
            ) : stats ? (
              <div className="flex flex-col gap-4">
                {activeTab === 'overview' && (
                  <>
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
                        <Activity className="h-4 w-4 text-[#171717]" />
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
                            <Bar
                              dataKey="conversationCount"
                              fill="#171717"
                              radius={[4, 4, 0, 0]}
                              label={{ position: 'top', formatter: (label: any) => String(label) }}
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
                  </>
                )}

                {activeTab === 'calendar' && (
                  <>
                    {stats.last365DaysActivity && stats.last365DaysActivity.length > 0 ? (
                      <>
                        <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-[#171717]" />
                            <h3 className="text-sm font-medium text-[#171717]">年度热力图</h3>
                          </div>
                          <ContributionCalendar
                            activities={stats.last365DaysActivity}
                            yearTotal={stats.yearTotalConversations || 0}
                          />
                        </div>

                        {stats.last12MonthsActivity && stats.last12MonthsActivity.length > 0 && (
                          <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5]">
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 className="h-4 w-4 text-[#171717]" />
                              <h3 className="text-sm font-medium text-[#171717]">近12个月汇总</h3>
                            </div>
                            <MonthlyChart data={stats.last12MonthsActivity} />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-[#d4d4d4] mb-3" />
                        <p className="text-sm font-medium text-[#737373]">暂无使用日历数据</p>
                      </div>
                    )}
                  </>
                )}
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
    </TooltipProvider>
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
