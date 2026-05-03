'use client';

import { Modal, Spin, Tooltip as AntTooltip } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import {
  X,
  RefreshCw,
  Database,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  MessageCircle,
  Star,
  FileText,
  Clock,
  Activity,
  Package,
} from 'lucide-react';
import { CURRENT_VERSION } from '@/lib/changelog';
import { getRecentErrorLogs, ErrorLog } from '@/lib/error-log';
import { getOrCreateDeviceId } from '@/lib/device';
import { getRuntimeDuration, formatRuntimeDuration } from '@/lib/runtime-info';
import { fetchWithRetry } from '@/lib/fetch-wrapper';

interface SystemHealthPanelProps {
  open: boolean;
  onClose: () => void;
}

type HealthStatus = 'healthy' | 'warning' | 'error';

interface HealthData {
  overallStatus: HealthStatus;
  version: string;
  checkedAt: string;
  database: {
    status: HealthStatus;
    latency: number;
    tableCount: number;
    totalRecords: number;
    error?: string;
  };
  storage: {
    conversationCount: number;
    messageCount: number;
    favoriteCount: number;
    templateCount: number;
  };
}

const STATUS_COLORS: Record<HealthStatus, { bg: string; border: string; text: string; glow: string }> = {
  healthy: {
    bg: 'bg-green-500',
    border: 'border-green-500',
    text: 'text-green-500',
    glow: 'shadow-green-500/50',
  },
  warning: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-500',
    text: 'text-yellow-500',
    glow: 'shadow-yellow-500/50',
  },
  error: {
    bg: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-red-500',
    glow: 'shadow-red-500/50',
  },
};

const STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: '正常',
  warning: '警告',
  error: '异常',
};

const StatusRing = ({ status, size = 120 }: { status: HealthStatus; size?: number }) => {
  const colors = STATUS_COLORS[status];
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = status === 'healthy' ? 1 : status === 'warning' ? 0.7 : 0.4;
  const strokeDashoffset = circumference * (1 - progress);

  const getStrokeColor = () => {
    switch (status) {
      case 'healthy':
        return '#22c55e';
      case 'warning':
        return '#eab308';
      case 'error':
        return '#ef4444';
    }
  };

  const getBgStrokeColor = () => {
    switch (status) {
      case 'healthy':
        return '#dcfce7';
      case 'warning':
        return '#fef9c3';
      case 'error':
        return '#fee2e2';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className={`w-8 h-8 ${colors.text}`} />;
      case 'warning':
        return <AlertTriangle className={`w-8 h-8 ${colors.text}`} />;
      case 'error':
        return <XCircle className={`w-8 h-8 ${colors.text}`} />;
    }
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getBgStrokeColor()}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {getIcon()}
        <span className={`text-sm font-semibold mt-1 ${colors.text}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>
    </div>
  );
};

const StatusDot = ({ status }: { status: HealthStatus }) => {
  const colors = STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex h-2.5 w-2.5 rounded-full ${colors.bg} ${colors.glow} shadow-md`}
    />
  );
};

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getErrorLevelColor(level: ErrorLog['level']): string {
  switch (level) {
    case 'error':
      return 'text-red-500 bg-red-50 dark:bg-red-500/10';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10';
    case 'info':
      return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
  }
}

function getErrorLevelLabel(level: ErrorLog['level']): string {
  switch (level) {
    case 'error':
      return '错误';
    case 'warning':
      return '警告';
    case 'info':
      return '信息';
  }
}

export default function SystemHealthPanel({ open, onClose }: SystemHealthPanelProps) {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [runtime, setRuntime] = useState(0);
  const [refreshAnimating, setRefreshAnimating] = useState(false);

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();

      const response = await fetchWithRetry<HealthData>('/api/health', {
        method: 'GET',
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (response.success && response.data) {
        setHealthData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadErrorLogs = useCallback(() => {
    const logs = getRecentErrorLogs(5);
    setErrorLogs(logs);
  }, []);

  const updateRuntime = useCallback(() => {
    setRuntime(getRuntimeDuration());
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshAnimating(true);
    await Promise.all([fetchHealthData(), loadErrorLogs(), updateRuntime()]);
    setTimeout(() => setRefreshAnimating(false), 500);
  }, [fetchHealthData, loadErrorLogs, updateRuntime]);

  useEffect(() => {
    if (open) {
      handleRefresh();
    }
  }, [open, handleRefresh]);

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      updateRuntime();
    }, 1000);

    return () => clearInterval(interval);
  }, [open, updateRuntime]);

  const overallStatus = healthData?.overallStatus || 'healthy';

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      styles={{
        body: { padding: 0 },
      }}
      closeIcon={
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#737373] transition-colors hover:bg-[#ebebeb] hover:text-[#171717]"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      }
    >
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-[#171717]" />
            <span className="text-sm font-semibold text-[#171717]">系统状态</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshAnimating ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !healthData ? (
            <div className="flex items-center justify-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-col items-center py-6 bg-gradient-to-b from-[#fafafa] to-white rounded-lg border border-black/[0.06]">
                <StatusRing status={overallStatus} size={120} />
                <p className="text-xs text-[#737373] mt-3">
                  最后检查时间: {healthData?.checkedAt ? formatTimestamp(healthData.checkedAt) : '-'}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-black/[0.06] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#fafafa] border-b border-black/[0.06]">
                  <Database className="w-4 h-4 text-[#525252]" />
                  <span className="text-sm font-medium text-[#171717]">数据库状态</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-3 bg-[#fafafa] rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusDot status={healthData?.database.status || 'healthy'} />
                        <span className="text-xs font-medium text-[#525252]">连接状态</span>
                      </div>
                      <span className="text-lg font-semibold text-[#171717]">
                        {STATUS_LABELS[healthData?.database.status || 'healthy']}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-[#fafafa] rounded-lg">
                      <span className="text-xs text-[#737373] mb-1">表数量</span>
                      <span className="text-lg font-semibold text-[#171717]">
                        {healthData?.database.tableCount || 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-[#fafafa] rounded-lg">
                      <span className="text-xs text-[#737373] mb-1">总记录数</span>
                      <span className="text-lg font-semibold text-[#171717]">
                        {healthData?.database.totalRecords || 0}
                      </span>
                    </div>
                  </div>
                  {healthData?.database.latency !== undefined && (
                    <p className="text-xs text-[#a3a3a3] mt-3 text-center">
                      查询延迟: {healthData.database.latency}ms
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/[0.06] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#fafafa] border-b border-black/[0.06]">
                  <HardDrive className="w-4 h-4 text-[#525252]" />
                  <span className="text-sm font-medium text-[#171717]">存储统计</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="flex flex-col items-center p-3 bg-[#fafafa] rounded-lg">
                      <MessageSquare className="w-5 h-5 text-[#3b82f6] mb-1.5" />
                      <span className="text-lg font-semibold text-[#171717]">
                        {healthData?.storage.conversationCount || 0}
                      </span>
                      <span className="text-xs text-[#737373]">对话</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-[#fafafa] rounded-lg">
                      <MessageCircle className="w-5 h-5 text-[#8b5cf6] mb-1.5" />
                      <span className="text-lg font-semibold text-[#171717]">
                        {healthData?.storage.messageCount || 0}
                      </span>
                      <span className="text-xs text-[#737373]">消息</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-[#fafafa] rounded-lg">
                      <Star className="w-5 h-5 text-[#f59e0b] mb-1.5" />
                      <span className="text-lg font-semibold text-[#171717]">
                        {healthData?.storage.favoriteCount || 0}
                      </span>
                      <span className="text-xs text-[#737373]">收藏</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-[#fafafa] rounded-lg">
                      <FileText className="w-5 h-5 text-[#10b981] mb-1.5" />
                      <span className="text-lg font-semibold text-[#171717]">
                        {healthData?.storage.templateCount || 0}
                      </span>
                      <span className="text-xs text-[#737373]">模板</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#fafafa] border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#525252]" />
                    <span className="text-sm font-medium text-[#171717]">最近错误</span>
                  </div>
                  <span className="text-xs text-[#a3a3a3]">最近 5 条</span>
                </div>
                <div className="p-4">
                  {errorLogs.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-[#a3a3a3]">
                      <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
                      <span className="text-sm">暂无错误记录</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {errorLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-[#fafafa] rounded-lg border border-black/[0.04]"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getErrorLevelColor(log.level)}`}
                              >
                                {getErrorLevelLabel(log.level)}
                              </span>
                              {log.source && (
                                <span className="text-xs text-[#a3a3a3]">{log.source}</span>
                              )}
                            </div>
                            <span className="text-xs text-[#a3a3a3] shrink-0">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <AntTooltip title={log.stack}>
                            <p className="text-xs text-[#525252] break-all line-clamp-2">
                              {log.message}
                            </p>
                          </AntTooltip>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-[#737373]" />
            <span className="text-xs text-[#737373]">
              版本 v{CURRENT_VERSION}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#737373]" />
            <span className="text-xs text-[#737373]">
              运行时间: {formatRuntimeDuration(runtime)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
