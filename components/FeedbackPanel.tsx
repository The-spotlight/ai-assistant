'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';
import { downloadFeedbackStatsAsCsv, downloadFeedbackStatsAsPdf } from '@/lib/export';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Download,
  FileText,
  RefreshCw,
} from 'lucide-react';

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
  modelDistribution: {
    modelId: string;
    likes: number;
    dislikes: number;
    total: number;
  }[];
  availableModels: string[];
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

const COLORS = ['#171717', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function FeedbackPanel({ visible, onClose }: FeedbackPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last7days');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('all');

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
      
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate.toISOString());
        params.set('endDate', endDate.toISOString());
      }
      if (selectedModel && selectedModel !== 'all') {
        params.set('modelId', selectedModel);
      }
      params.set('includeModels', 'true');
      
      const url = `/api/feedback-stats?${params.toString()}`;
      
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
  }, [getDateRange, isFirstLoad, error, selectedModel]);

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
            <MessageSquare className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">反馈统计</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button
                variant={timeRange === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('today')}
                className="text-xs"
              >
                今天
              </Button>
              <Button
                variant={timeRange === 'last7days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('last7days')}
                className="text-xs"
              >
                最近7天
              </Button>
              <Button
                variant={timeRange === 'last30days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('last30days')}
                className="text-xs"
              >
                最近30天
              </Button>
              <Button
                variant={timeRange === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('custom')}
                className="text-xs"
              >
                自定义
              </Button>
              <div className="flex items-center gap-2 mr-2">
                <label className="text-xs font-medium text-[#525252] shrink-0">模型:</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部模型</SelectItem>
                    {stats?.availableModels.map((model) => (
                      <SelectItem key={model} value={model} title={model}>
                        {model.length > 20 ? model.substring(0, 20) + '...' : model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => stats && downloadFeedbackStatsAsCsv(stats)}
                disabled={loading || !stats || (timeRange === 'custom' && (!customStartDate || !customEndDate))}
                className="text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                导出CSV
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!stats || !chartRef.current || !pieChartRef.current) return;
                  setExporting(true);
                  try {
                    await downloadFeedbackStatsAsPdf(stats, chartRef.current, pieChartRef.current);
                  } catch (err) {
                    console.error('Failed to export PDF:', err);
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={loading || !stats || exporting || (timeRange === 'custom' && (!customStartDate || !customEndDate))}
                className="text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                {exporting ? '生成中...' : '导出PDF'}
              </Button>
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
                <Button
                  onClick={fetchFeedbackStats}
                  className="mt-3"
                >
                  <RefreshCw className="h-3 w-3" />
                  应用
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#d4d4d4] animate-spin mb-3" />
              <p className="text-sm font-medium text-[#737373]">正在加载数据...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">{error}</p>
              <Button onClick={fetchFeedbackStats} className="mt-2">
                重试
              </Button>
            </div>
          ) : stats ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-around gap-4 py-4 border-b border-black/[0.06]">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f0fdf4] text-[#22c55e]">
                    <ThumbsUp className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">{stats.totalLikes}</div>
                  <div className="text-xs text-[#737373]">点赞</div>
                </div>
                <div className="w-px h-12 bg-[#e5e5e5]"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#fef2f2] text-[#ef4444]">
                    <ThumbsDown className="h-6 w-6" />
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

                <div ref={chartRef} className="bg-[#fafafa] rounded-lg p-3 border border-[#e5e5e5]">
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
                <h3 className="text-sm font-medium text-[#171717] mb-3">模型分布</h3>
                {stats.modelDistribution.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {stats.modelDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-[#fafafa] rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#171717]"></div>
                          <span className="text-sm text-[#525252] max-w-[150px] truncate" title={item.modelId}>{item.modelId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3 text-[#22c55e]" />
                            <span className="text-xs text-[#22c55e]">{item.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3 text-[#ef4444]" />
                            <span className="text-xs text-[#ef4444]">{item.dislikes}</span>
                          </div>
                          <span className="text-xs font-medium text-[#171717]">{item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-sm text-[#737373]">暂无模型数据</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-[#171717] mb-3">反馈原因分布</h3>
                {stats.reasonDistribution.length > 0 ? (
                  <div ref={pieChartRef} className="bg-[#fafafa] rounded-lg p-3 border border-[#e5e5e5]">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie
                            data={stats.reasonDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="count"
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            labelLine={{ strokeWidth: 1 }}
                          >
                            {stats.reasonDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {stats.reasonDistribution.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 px-2 py-1 bg-white rounded-md">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="text-xs text-[#525252]">{item.reason}</span>
                            <span className="text-xs font-medium text-[#171717]">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <MessageSquare className="h-8 w-8 text-[#d4d4d4] mb-2" />
                    <p className="text-sm text-[#737373]">暂无反馈数据</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373]">暂无反馈数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}