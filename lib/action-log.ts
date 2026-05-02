'use client';

export type ActionType = 
  | 'create_conversation' 
  | 'delete_conversation' 
  | 'favorite_message' 
  | 'unfavorite_message'
  | 'modify_settings' 
  | 'export_data'
  | 'import_data'
  | 'share_conversation'
  | 'archive_conversation'
  | 'restore_conversation'
  | 'empty_trash';

export interface ActionLog {
  id: string;
  type: ActionType;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const ACTION_LOGS_STORAGE_KEY = 'ai-assistant-action-logs';
const LOG_RETENTION_DAYS = 7;
const PAGE_SIZE = 20;

export const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; icon: string }> = {
  create_conversation: { label: '创建对话', icon: 'plus' },
  delete_conversation: { label: '删除对话', icon: 'trash' },
  favorite_message: { label: '收藏消息', icon: 'star' },
  unfavorite_message: { label: '取消收藏', icon: 'star-off' },
  modify_settings: { label: '修改设置', icon: 'settings' },
  export_data: { label: '导出数据', icon: 'download' },
  import_data: { label: '导入数据', icon: 'upload' },
  share_conversation: { label: '分享对话', icon: 'share' },
  archive_conversation: { label: '归档对话', icon: 'archive' },
  restore_conversation: { label: '恢复对话', icon: 'restore' },
  empty_trash: { label: '清空回收站', icon: 'trash-2' },
};

export function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function loadActionLogs(): ActionLog[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(ACTION_LOGS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ActionLog[];
    return parsed.filter(validateActionLog);
  } catch {
    return [];
  }
}

export function saveActionLogs(logs: ActionLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTION_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    console.warn('Failed to save action logs');
  }
}

export function validateActionLog(log: unknown): log is ActionLog {
  if (typeof log !== 'object' || log === null) {
    return false;
  }

  const l = log as any;

  if (typeof l.id !== 'string' || !l.id) return false;
  if (typeof l.type !== 'string' || !(l.type in ACTION_TYPE_CONFIG)) return false;
  if (typeof l.description !== 'string') return false;
  if (typeof l.timestamp !== 'string' || !l.timestamp) return false;

  return true;
}

export function addActionLog(type: ActionType, description: string, metadata?: Record<string, any>): void {
  const logs = loadActionLogs();
  const newLog: ActionLog = {
    id: generateLogId(),
    type,
    description,
    timestamp: new Date().toISOString(),
    metadata,
  };
  
  const updated = [newLog, ...logs];
  saveActionLogs(updated);
  
  cleanupOldLogs();
}

export function getActionLogs(
  page: number = 1, 
  filterType?: ActionType
): { logs: ActionLog[]; hasMore: boolean; total: number } {
  let logs = loadActionLogs();
  
  cleanupOldLogs();
  
  logs = loadActionLogs();
  
  if (filterType) {
    logs = logs.filter(log => log.type === filterType);
  }
  
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedLogs = logs.slice(startIndex, endIndex);
  
  return {
    logs: paginatedLogs,
    hasMore: endIndex < logs.length,
    total: logs.length,
  };
}

export function cleanupOldLogs(): void {
  const logs = loadActionLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);
  
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= cutoffDate;
  });
  
  if (filteredLogs.length !== logs.length) {
    saveActionLogs(filteredLogs);
  }
}

export function clearAllActionLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTION_LOGS_STORAGE_KEY);
  } catch {
    console.warn('Failed to clear action logs');
  }
}

export function createSampleLogs(): void {
  const now = new Date();
  
  const sampleLogs: ActionLog[] = [
    {
      id: generateLogId(),
      type: 'create_conversation',
      description: '创建了新对话"Python 学习助手"',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      metadata: { conversationId: 'sample_1' }
    },
    {
      id: generateLogId(),
      type: 'favorite_message',
      description: '收藏了消息"如何在 Python 中实现单例模式？"',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      metadata: { messageId: 'sample_msg_1' }
    },
    {
      id: generateLogId(),
      type: 'modify_settings',
      description: '修改了设置：将默认模型从 GPT-4 改为 Claude 3.5 Sonnet',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      metadata: { setting: 'defaultModel', oldValue: 'gpt-4', newValue: 'claude-3.5-sonnet' }
    },
    {
      id: generateLogId(),
      type: 'export_data',
      description: '导出了全部对话数据',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      metadata: { exportType: 'all_conversations' }
    },
    {
      id: generateLogId(),
      type: 'share_conversation',
      description: '分享了对话"React 性能优化技巧"',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      metadata: { conversationId: 'sample_2', shareId: 'sample_share_1' }
    },
    {
      id: generateLogId(),
      type: 'delete_conversation',
      description: '删除了对话"临时测试对话"',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { conversationId: 'sample_3' }
    },
    {
      id: generateLogId(),
      type: 'modify_settings',
      description: '修改了设置：开启了自动归档功能',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { setting: 'autoArchive', oldValue: false, newValue: true }
    },
    {
      id: generateLogId(),
      type: 'archive_conversation',
      description: '归档了3个过期对话',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { count: 3 }
    },
    {
      id: generateLogId(),
      type: 'favorite_message',
      description: '收藏了消息"TypeScript 泛型详解"',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { messageId: 'sample_msg_2' }
    },
    {
      id: generateLogId(),
      type: 'create_conversation',
      description: '创建了新对话"项目需求分析"',
      timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { conversationId: 'sample_4' }
    },
  ];
  
  saveActionLogs(sampleLogs);
}
