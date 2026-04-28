'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';
import { CloseButton } from '@/components/ui/Dialog';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, BarChart3, Loader2, User } from 'lucide-react';

type UserStats = {
  totalDays: number;
  lastActiveTime: string | null;
  last7DaysUsage: {
    date: string;
    conversationCount: number;
  }[];
};

interface UserStatsPanelProps {
  visible: boolean;
  onClose: () => void;
}

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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
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