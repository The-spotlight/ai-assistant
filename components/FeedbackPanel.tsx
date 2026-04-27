'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';
import { downloadFeedbackStatsAsCsv } from '@/lib/export';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconFeedback(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M18 8h-4" />
      <path d="M16 12h-2" />
      <path d="M18 16h-6" />
    </svg>
  );
}

function IconThumbsUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function IconThumbsDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M10 15v4a3 3 0 0 1-3 3l-4-9V2H11.28a2 2 0 0 1 2 1.7l1.38 9a2 2 0 0 1-2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function IconLoader(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function IconDownload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

type FeedbackStats = {
  totalLikes: number;
  totalDislikes: number;
  reasonDistribution: {
    reason: string;
    count: number;
  }[];
  dailyTrend: {
    date: string;
    likes: number;
    dislikes: number;
    total: number;
  }[];
};

type TimeRange = 'today' | 'last7days' | 'last30days' | 'custom';
type ViewMode = 'daily' | 'weekly';

interface FeedbackPanelProps {
  visible: boolean;
  onClose: () => void;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const date = new Date(label as string);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
    
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg shadow-lg p-3">
        <div className="text-sm font-medium text-[#171717] mb-2">{formattedDate}</div>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-[#525252]">
                {entry.dataKey === 'likes' ? '点赞' : '点踩'}
              </span>
            </div>
            <span className="text-sm font-medium text-[#171717]">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FeedbackPanel({ visible, onClose }: FeedbackPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last7days');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const getDateRange = useCallback(() => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    let startDate: Date;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          return { startDate: null, endDate: null };
        }
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const customEnd = new Date(customEndDate);
        customEnd.setHours(23, 59, 59, 999);
        return { startDate, endDate: customEnd };
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }
    
    return { startDate, endDate };
  }, [timeRange, customStartDate, customEndDate]);

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchFeedbackStats = useCallback(async () => {
    if (isFirstLoad || error) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const deviceId = getOrCreateDeviceId();
      const { startDate, endDate } = getDateRange();
      
      let url = '/api/feedback-stats';
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching feedback stats:', err);
      setError('获取反馈统计数据失败');
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [getDateRange, isFirstLoad, error]);

  useEffect(() => {
    if (visible) {
      fetchFeedbackStats();
    }
  }, [visible, fetchFeedbackStats]);

  useEffect(() => {
    if (visible && timeRange !== 'custom') {
      fetchFeedbackStats();
    }
  }, [timeRange, visible, fetchFeedbackStats]);

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

  const getWeeklyData = (dailyData: FeedbackStats['dailyTrend']) => {
    const weeklyMap = new Map<string, { likes: number; dislikes: number; total: number }>();
    
    dailyData.forEach(item => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const weekStart = monday.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekStart)) {
        weeklyMap.set(weekStart, { likes: 0, dislikes: 0, total: 0 });
      }
      const weekData = weeklyMap.get(weekStart)!;
      weekData.likes += item.likes;
      weekData.dislikes += item.dislikes;
      weekData.total += item.total;
    });
    
    return Array.from(weeklyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  };

  const displayData = viewMode === 'weekly' && stats?.dailyTrend 
    ? getWeeklyData(stats.dailyTrend) 
    : stats?.dailyTrend;

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
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
            <IconFeedback className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">反馈统计</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#404040] transition-colors"
            aria-label="关闭"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${timeRange === 'today' ? 'bg-[#171717] text-white' : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'}`}
                onClick={() => setTimeRange('today')}
              >
                今天
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${timeRange === 'last7days' ? 'bg-[#171717] text-white' : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'}`}
                onClick={() => setTimeRange('last7days')}
              >
                最近7天
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${timeRange === 'last30days' ? 'bg-[#171717] text-white' : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'}`}
                onClick={() => setTimeRange('last30days')}
              >
                最近30天
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${timeRange === 'custom' ? 'bg-[#171717] text-white' : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'}`}
                onClick={() => setTimeRange('custom')}
              >
                自定义
              </button>
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={() => stats && downloadFeedbackStatsAsCsv(stats)}
                disabled={loading || !stats || (timeRange === 'custom' && (!customStartDate || !customEndDate))}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all border disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-[#fafafa] disabled:border-[#e5e5e5] disabled:text-[#a3a3a3] disabled:hover:bg-[#fafafa] disabled:hover:border-[#e5e5e5] disabled:hover:text-[#a3a3a3] bg-white border border-[#d4d4d4] text-[#525252] hover:bg-[#fafafa] hover:border-[#171717] hover:text-[#171717]"
                aria-label="导出CSV"
              >
                <IconDownload className="h-3.5 w-3.5" />
                导出CSV
              </button>
            </div>
            
            {timeRange === 'custom' && (
              <div className="flex flex-col gap-2 p-3 bg-[#fafafa] rounded-lg border border-[#e5e5e5]">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#525252] w-20">开始日期</label>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={customStartDate}
                      onClick={(e) => {
                        e.preventDefault();
                        const dateInput = document.createElement('input');
                        dateInput.type = 'date';
                        dateInput.value = customStartDate;
                        dateInput.onchange = (ev) => {
                          setCustomStartDate((ev.target as HTMLInputElement).value);
                        };
                        dateInput.click();
                      }}
                      className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20 transition-all bg-white cursor-pointer"
                      placeholder="选择开始日期"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#525252] w-20">结束日期</label>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={customEndDate}
                      onClick={(e) => {
                        e.preventDefault();
                        const dateInput = document.createElement('input');
                        dateInput.type = 'date';
                        dateInput.value = customEndDate;
                        dateInput.onchange = (ev) => {
                          setCustomEndDate((ev.target as HTMLInputElement).value);
                        };
                        dateInput.click();
                      }}
                      className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20 transition-all bg-white cursor-pointer"
                      placeholder="选择结束日期"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchFeedbackStats}
                  className="mt-3 px-4 py-2 text-xs font-medium text-white bg-[#171717] rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  应用
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconLoader className="h-8 w-8 text-[#d4d4d4] animate-spin mb-3" />
              <p className="text-sm font-medium text-[#737373]">正在加载数据...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconFeedback className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">{error}</p>
              <button
                type="button"
                onClick={fetchFeedbackStats}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[#171717] rounded-lg hover:bg-black transition-colors"
              >
                重试
              </button>
            </div>
          ) : stats ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-around gap-4 py-4 border-b border-black/[0.06]">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f0fdf4] text-[#22c55e]">
                    <IconThumbsUp className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">{stats.totalLikes}</div>
                  <div className="text-xs text-[#737373]">点赞</div>
                </div>
                <div className="w-px h-12 bg-[#e5e5e5]"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#fef2f2] text-[#ef4444]">
                    <IconThumbsDown className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">{stats.totalDislikes}</div>
                  <div className="text-xs text-[#737373]">点踩</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#171717]">赞踩趋势</h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'daily' ? 'bg-[#171717] text-white' : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'}`}
                      onClick={() => setViewMode('daily')}
                    >
                      每日
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'weekly' ? 'bg-[#171717] text-white' : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'}`}
                      onClick={() => setViewMode('weekly')}
                    >
                      每周
                    </button>
                  </div>
                </div>

                <div className="bg-[#fafafa] rounded-lg p-3 border border-[#e5e5e5]">
                  {displayData && displayData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={displayData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatXAxis}
                          tick={{ fill: '#737373', fontSize: 11 }}
                          axisLine={{ stroke: '#e5e5e5' }}
                          tickLine={{ stroke: '#e5e5e5' }}
                        />
                        <YAxis
                          tick={{ fill: '#737373', fontSize: 11 }}
                          axisLine={{ stroke: '#e5e5e5' }}
                          tickLine={{ stroke: '#e5e5e5' }}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: '10px' }}
                          iconType="circle"
                          formatter={(value) => value === 'likes' ? '点赞' : '点踩'}
                        />
                        <Line
                          type="monotone"
                          dataKey="likes"
                          name="点赞"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: '#22c55e', r: 4 }}
                          activeDot={{ fill: '#22c55e', r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="dislikes"
                          name="点踩"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: '#ef4444', r: 4 }}
                          activeDot={{ fill: '#ef4444', r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-sm text-[#737373]">
                      暂无趋势数据
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[#171717] mb-3">反馈原因分布</h3>
                {stats.reasonDistribution.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {stats.reasonDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#171717]"></div>
                          <span className="text-sm text-[#525252]">{item.reason}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#171717]">{item.count}</span>
                          <div className="flex-1 h-2 bg-[#f5f5f5] rounded-full ml-2 max-w-[120px]">
                            <div 
                              className="h-full bg-[#171717] rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((item.count / Math.max(...stats.reasonDistribution.map(r => r.count))) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <IconFeedback className="h-8 w-8 text-[#d4d4d4] mb-2" />
                    <p className="text-sm text-[#737373]">暂无反馈数据</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <IconFeedback className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373]">暂无反馈数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}