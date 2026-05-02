'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Star, 
  Settings, 
  Download, 
  Upload, 
  Share2, 
  Archive, 
  RotateCcw, 
  Trash,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';
import { 
  ActionType, 
  ActionLog, 
  getActionLogs, 
  ACTION_TYPE_CONFIG,
  clearAllActionLogs,
  cleanupOldLogs,
  createSampleLogs
} from '@/lib/action-log';
import { Button } from '@/components/ui/Button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { message } from 'antd';

const LOG_ICONS: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  create_conversation: Plus,
  delete_conversation: Trash2,
  favorite_message: Star,
  unfavorite_message: Star,
  modify_settings: Settings,
  export_data: Download,
  import_data: Upload,
  share_conversation: Share2,
  archive_conversation: Archive,
  restore_conversation: RotateCcw,
  empty_trash: Trash,
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const logTime = new Date(timestamp);
  const diffMs = now.getTime() - logTime.getTime();
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return logTime.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function ActionLogPanel() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<ActionType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadLogs = useCallback((page: number, type: ActionType | 'all') => {
    setLoading(true);
    
    setTimeout(() => {
      const result = getActionLogs(page, type === 'all' ? undefined : type);
      setLogs(result.logs);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    cleanupOldLogs();
    loadLogs(currentPage, filterType);
  }, [currentPage, filterType, loadLogs]);

  const handleFilterChange = (value: string) => {
    setFilterType(value as ActionType | 'all');
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleLoadPrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleClearLogs = () => {
    clearAllActionLogs();
    setCurrentPage(1);
    loadLogs(1, filterType);
    setShowClearConfirm(false);
    message.success('已清空所有操作日志');
  };

  const renderLogItem = (log: ActionLog) => {
    const Icon = LOG_ICONS[log.type];
    const config = ACTION_TYPE_CONFIG[log.type];
    
    return (
      <div 
        key={log.id} 
        className="flex items-start gap-3 py-3 border-b border-black/[0.04] last:border-0 hover:bg-[#fafafa] transition-colors px-2 -mx-2 rounded-lg"
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          log.type === 'delete_conversation' || log.type === 'empty_trash' 
            ? 'bg-[#fef2f2] text-[#dc2626]' 
            : log.type === 'favorite_message' 
            ? 'bg-[#fffbeb] text-[#f59e0b]' 
            : log.type === 'create_conversation' 
            ? 'bg-[#f0fdf4] text-[#16a34a]' 
            : 'bg-[#f5f5f5] text-[#525252]'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#171717]">{config.label}</span>
            <span className="text-[10px] text-[#a3a3a3] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(log.timestamp)}
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5 line-clamp-2">{log.description}</p>
        </div>
      </div>
    );
  };

  const renderLogsWithDateGroups = () => {
    if (logs.length === 0) {
      return null;
    }

    const groups: { date: string; logs: ActionLog[] }[] = [];
    
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const dateKey = formatDate(log.timestamp);
      
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.logs.push(log);
      } else {
        groups.push({ date: dateKey, logs: [log] });
      }
    });

    return groups.map((group, groupIndex) => (
      <div key={groupIndex} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-3.5 h-3.5 text-[#a3a3a3]" />
          <span className="text-[10px] font-medium text-[#737373] uppercase tracking-wide">
            {group.date}
          </span>
        </div>
        <div className="pl-2 border-l-2 border-[#f5f5f5] ml-1.5">
          {group.logs.map(renderLogItem)}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#171717]">操作日志</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#737373]">
              共 {total} 条记录
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7 px-3"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            清空日志
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[#737373]">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs">筛选：</span>
          </div>
          <Select value={filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {(Object.entries(ACTION_TYPE_CONFIG) as [ActionType, typeof ACTION_TYPE_CONFIG[ActionType]][]).map(
                ([key, config]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {config.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        
        <p className="text-[10px] text-[#a3a3a3]">
          日志仅保留最近 7 天的记录，超过的自动清理
        </p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#737373] animate-spin" />
            <span className="text-xs text-[#a3a3a3] mt-2">加载中...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-3">
              <Clock className="w-8 h-8 text-[#a3a3a3]" />
            </div>
            <p className="text-sm text-[#737373]">暂无操作记录</p>
            <p className="text-[10px] text-[#a3a3a3] mt-1 mb-4">
              {filterType !== 'all' ? '尝试切换筛选条件' : '您的操作记录将显示在这里'}
            </p>
            {filterType === 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 px-4"
                onClick={() => {
                  createSampleLogs();
                  loadLogs(1, 'all');
                }}
              >
                加载示例数据
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {renderLogsWithDateGroups()}
          </div>
        )}
      </div>

      {!loading && logs.length > 0 && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/[0.06]">
          <div className="text-[10px] text-[#a3a3a3]">
            第 {currentPage} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleLoadPrev}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleLoadMore}
              disabled={!hasMore}
            >
              下一页
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-black/[0.08] bg-white p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef2f2]">
                <Trash2 className="h-5 w-5 text-[#dc2626]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#171717]">确认清空</h3>
                <p className="text-[11px] text-[#737373] mt-0.5">此操作不可恢复</p>
              </div>
            </div>
            <p className="text-sm text-[#525252] mb-5">
              确定要清空所有操作日志吗？
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowClearConfirm(false)}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleClearLogs}
              >
                确认清空
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
