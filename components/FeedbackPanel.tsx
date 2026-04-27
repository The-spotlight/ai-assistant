'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';

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

type FeedbackStats = {
  totalLikes: number;
  totalDislikes: number;
  reasonDistribution: {
    reason: string;
    count: number;
  }[];
};

interface FeedbackPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackPanel({ visible, onClose }: FeedbackPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbackStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/feedback-stats', {
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
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchFeedbackStats();
    }
  }, [visible, fetchFeedbackStats]);

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
        className="mx-4 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
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
              {/* 总反馈统计 */}
              <div className="flex items-center justify-around gap-4 py-4 border-b border-black/[0.06]">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f0fdf4] text-[#22c55e]">
                    <IconThumbsUp className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">{stats.totalLikes}</div>
                  <div className="text-xs text-[#737373]">总点赞</div>
                </div>
                <div className="w-px h-12 bg-[#e5e5e5]"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#fef2f2] text-[#ef4444]">
                    <IconThumbsDown className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-[#171717]">{stats.totalDislikes}</div>
                  <div className="text-xs text-[#737373]">总点踩</div>
                </div>
              </div>

              {/* 原因分布 */}
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
                          <div className="flex-1 h-2 bg-[#f5f5f5] rounded-full ml-2">
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
