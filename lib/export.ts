import JSZip from 'jszip';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

interface ConversationExport {
  id: string;
  title: string | null;
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
}

export type ExportFormat = 'markdown' | 'plaintext' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  selectedMessageIds?: string[];
  customTitle?: string;
  customNote?: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 100);
}

function formatMessageForExport(message: Message, prefix?: string): string {
  const roleLabel = message.role === 'user' ? '我' : message.role === 'assistant' ? 'AI' : '系统';
  const rolePrefix = prefix ? `[${prefix}]` : '';
  const content = message.content.trim();
  
  if (message.role === 'user') {
    return `## ${rolePrefix}${roleLabel}\n\n${content}\n\n`;
  }
  
  if (message.role === 'assistant') {
    return `## ${rolePrefix}${roleLabel}\n\n${content}\n\n`;
  }
  
  return `## ${rolePrefix}${roleLabel}\n\n${content}\n\n`;
}

function formatMessageForPlainText(message: Message): string {
  const roleLabel = message.role === 'user' ? '我' : message.role === 'assistant' ? 'AI' : '系统';
  const content = message.content.trim();
  const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleString('zh-CN') : '';
  
  return `${roleLabel} ${timestamp ? `(${timestamp})` : ''}\n${content}\n\n`;
}

function getFilteredMessages(conversation: ConversationExport, selectedMessageIds?: string[]): Message[] {
  if (!selectedMessageIds || selectedMessageIds.length === 0) {
    return conversation.messages.filter(m => m.role !== 'system');
  }
  return conversation.messages.filter(m => m.role !== 'system' && selectedMessageIds.includes(m.id));
}

export function conversationToMarkdown(
  conversation: ConversationExport,
  options?: ExportOptions
): string {
  const { includeMetadata = true, selectedMessageIds, customTitle, customNote } = options || {};
  
  let markdown = '';
  
  const title = customTitle?.trim() || conversation.title?.trim() || '未命名对话';
  markdown += `# ${title}\n\n`;
  
  if (customNote) {
    markdown += `## 备注\n\n${customNote}\n\n`;
  }
  
  if (includeMetadata) {
    if (conversation.createdAt) {
      const createdDate = new Date(conversation.createdAt);
      markdown += `创建时间: ${createdDate.toLocaleString('zh-CN')}\n\n`;
    }
    if (conversation.updatedAt) {
      const updatedDate = new Date(conversation.updatedAt);
      markdown += `更新时间: ${updatedDate.toLocaleString('zh-CN')}\n\n`;
    }
    markdown += `---\n\n`;
  }
  
  const messages = getFilteredMessages(conversation, selectedMessageIds);
  for (const message of messages) {
    markdown += formatMessageForExport(message);
  }
  
  return markdown;
}

export function conversationToPlainText(
  conversation: ConversationExport,
  options?: ExportOptions
): string {
  const { includeMetadata = true, selectedMessageIds, customTitle, customNote } = options || {};
  
  let plainText = '';
  
  const title = customTitle?.trim() || conversation.title?.trim() || '未命名对话';
  plainText += `${title}\n${'='.repeat(title.length)}\n\n`;
  
  if (customNote) {
    plainText += `备注:\n${customNote}\n\n`;
  }
  
  if (includeMetadata) {
    if (conversation.createdAt) {
      const createdDate = new Date(conversation.createdAt);
      plainText += `创建时间: ${createdDate.toLocaleString('zh-CN')}\n`;
    }
    if (conversation.updatedAt) {
      const updatedDate = new Date(conversation.updatedAt);
      plainText += `更新时间: ${updatedDate.toLocaleString('zh-CN')}\n`;
    }
    plainText += `\n`;
  }
  
  const messages = getFilteredMessages(conversation, selectedMessageIds);
  for (const message of messages) {
    plainText += formatMessageForPlainText(message);
  }
  
  return plainText;
}

export function conversationToJson(
  conversation: ConversationExport,
  options?: ExportOptions
): string {
  const { selectedMessageIds, customTitle, customNote } = options || {};
  
  const messages = getFilteredMessages(conversation, selectedMessageIds);
  
  const exportData = {
    id: conversation.id,
    title: customTitle?.trim() || conversation.title?.trim() || '未命名对话',
    note: customNote,
    metadata: {
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    },
    messages: messages
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function conversationToFormat(
  conversation: ConversationExport,
  options: ExportOptions
): string {
  switch (options.format) {
    case 'markdown':
      return conversationToMarkdown(conversation, options);
    case 'plaintext':
      return conversationToPlainText(conversation, options);
    case 'json':
      return conversationToJson(conversation, options);
    default:
      return conversationToMarkdown(conversation, options);
  }
}

export async function createZipFromConversations(
  conversations: ConversationExport[],
  options?: ExportOptions
): Promise<Uint8Array> {
  const zip = new JSZip();
  const format = options?.format || 'markdown';
  
  for (const conv of conversations) {
    const title = options?.customTitle?.trim() || conv.title?.trim() || '未命名对话';
    const extension = format === 'markdown' ? 'md' : format === 'plaintext' ? 'txt' : 'json';
    const filename = `${sanitizeFilename(title)}.${extension}`;
    const content = conversationToFormat(conv, { ...options, format });
    zip.file(filename, content);
  }
  
  return zip.generateAsync({ type: 'uint8array' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface FeedbackStats {
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
}

function escapeCsvField(field: string | number): string {
  const value = String(field);
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function feedbackStatsToCsv(stats: FeedbackStats): string {
  let csv = '';
  
  csv += '# 反馈统计报告\n';
  csv += `统计时间: ${new Date().toLocaleString('zh-CN')}\n`;
  csv += '\n';
  
  csv += '# 总体统计\n';
  csv += '指标,数值\n';
  csv += `总赞数,${stats.totalLikes}\n`;
  csv += `总踩数,${stats.totalDislikes}\n`;
  csv += `总反馈数,${stats.totalLikes + stats.totalDislikes}\n`;
  csv += '\n';
  
  csv += '# 每日趋势\n';
  csv += '日期,赞数,踩数,总数\n';
  stats.dailyTrend.forEach(item => {
    csv += `${escapeCsvField(item.date)},${item.likes},${item.dislikes},${item.total}\n`;
  });
  csv += '\n';
  
  csv += '# 反馈原因分布\n';
  csv += '原因,数量\n';
  stats.reasonDistribution.forEach(item => {
    csv += `${escapeCsvField(item.reason)},${item.count}\n`;
  });
  
  return csv;
}

export function downloadFeedbackStatsAsCsv(stats: FeedbackStats): void {
  const csv = feedbackStatsToCsv(stats);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const filename = `反馈统计_${new Date().toISOString().split('T')[0]}.csv`;
  downloadBlob(blob, filename);
}
