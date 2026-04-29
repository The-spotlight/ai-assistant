import JSZip from 'jszip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

interface ConversationExport {
  id: string;
  title: string | null;
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
}

export type ExportFormat = 'markdown' | 'plaintext' | 'json' | 'csv';

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

function escapeCsvField(field: string | number | null | undefined): string {
  if (field == null) return '';
  const value = String(field);
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvDate(isoString: string | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
}

function getRoleLabel(role: string): string {
  if (role === 'user') return '我';
  if (role === 'assistant') return 'AI';
  if (role === 'system') return '系统';
  return role;
}

export function conversationToCsv(
  conversation: ConversationExport,
  options?: ExportOptions
): string {
  const { selectedMessageIds, customTitle } = options || {};
  
  const title = customTitle?.trim() || conversation.title?.trim() || '未命名对话';
  const messages = getFilteredMessages(conversation, selectedMessageIds);
  
  let csv = '';
  
  csv += '对话标题,消息序号,发送者,消息内容,创建时间,Token数量\n';
  
  messages.forEach((message, index) => {
    const messageIndex = index + 1;
    const roleLabel = getRoleLabel(message.role);
    const createdAt = formatCsvDate(message.createdAt);
    const tokenCount = message.totalTokens ?? '';
    
    csv += `${escapeCsvField(title)},${escapeCsvField(messageIndex)},${escapeCsvField(roleLabel)},${escapeCsvField(message.content)},${escapeCsvField(createdAt)},${escapeCsvField(tokenCount)}\n`;
  });
  
  return csv;
}

export function conversationsToCsv(
  conversations: ConversationExport[],
  options?: ExportOptions
): string {
  let csv = '';
  
  csv += '对话标题,消息序号,发送者,消息内容,创建时间,Token数量\n';
  
  conversations.forEach((conversation, convIndex) => {
    const { selectedMessageIds, customTitle } = options || {};
    
    const title = customTitle?.trim() || conversation.title?.trim() || '未命名对话';
    const messages = getFilteredMessages(conversation, selectedMessageIds);
    
    if (messages.length === 0) return;
    
    messages.forEach((message, msgIndex) => {
      const messageIndex = msgIndex + 1;
      const roleLabel = getRoleLabel(message.role);
      const createdAt = formatCsvDate(message.createdAt);
      const tokenCount = message.totalTokens ?? '';
      
      csv += `${escapeCsvField(title)},${escapeCsvField(messageIndex)},${escapeCsvField(roleLabel)},${escapeCsvField(message.content)},${escapeCsvField(createdAt)},${escapeCsvField(tokenCount)}\n`;
    });
    
    if (convIndex < conversations.length - 1) {
      csv += '\n';
    }
  });
  
  return csv;
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
    case 'csv':
      return conversationToCsv(conversation, options);
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
  
  if (format === 'csv' && conversations.length > 1) {
    const csvContent = conversationsToCsv(conversations, options);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `对话导出_${timestamp}.csv`;
    zip.file(filename, csvContent);
  } else {
    for (const conv of conversations) {
      const title = options?.customTitle?.trim() || conv.title?.trim() || '未命名对话';
      const extension = format === 'markdown' ? 'md' : format === 'plaintext' ? 'txt' : format === 'csv' ? 'csv' : 'json';
      const filename = `${sanitizeFilename(title)}.${extension}`;
      const content = conversationToFormat(conv, { ...options, format });
      zip.file(filename, content);
    }
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
  modelDistribution: {
    modelId: string;
    likes: number;
    dislikes: number;
    total: number;
  }[];
  availableModels: string[];
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
  
  csv += '# 模型分布\n';
  csv += '模型名称,赞数,踩数,总数\n';
  stats.modelDistribution?.forEach(item => {
    csv += `${escapeCsvField(item.modelId)},${item.likes},${item.dislikes},${item.total}\n`;
  });
  csv += '\n';
  
  csv += '# 每日趋势\n';
  csv += '日期,模型,赞数,踩数,总数\n';
  stats.dailyTrend.forEach(item => {
    csv += `${escapeCsvField(item.date)},${escapeCsvField(stats.availableModels?.join(';') || '全部模型')},${item.likes},${item.dislikes},${item.total}\n`;
  });
  csv += '\n';
  
  csv += '# 反馈原因分布\n';
  csv += '原因,数量,模型\n';
  stats.reasonDistribution.forEach(item => {
    csv += `${escapeCsvField(item.reason)},${item.count},${escapeCsvField(stats.availableModels?.join(';') || '全部模型')}\n`;
  });
  
  return csv;
}

export function downloadFeedbackStatsAsCsv(stats: FeedbackStats): void {
  const csv = feedbackStatsToCsv(stats);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const filename = `反馈统计_${new Date().toISOString().split('T')[0]}.csv`;
  downloadBlob(blob, filename);
}

export async function downloadFeedbackStatsAsPdf(
  stats: FeedbackStats,
  chartElement: HTMLElement,
  pieChartElement: HTMLElement
): Promise<void> {
  const totalFeedback = stats.totalLikes + stats.totalDislikes;
  const likeRate = totalFeedback > 0 ? ((stats.totalLikes / totalFeedback) * 100).toFixed(1) : '0';

  const chartCanvas = await html2canvas(chartElement, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  const pieCanvas = await html2canvas(pieChartElement, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  const chartDataUrl = chartCanvas.toDataURL('image/jpeg', 0.95);
  const pieDataUrl = pieCanvas.toDataURL('image/jpeg', 0.95);

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -10000px;
    top: -10000px;
    width: 595px;
    min-height: 842px;
    padding: 40px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    font-size: 12px;
    color: #171717;
    z-index: 9999;
  `;

  container.innerHTML = `
    <style>
      .report-header { text-align: center; margin-bottom: 20px; }
      .report-header h1 { font-size: 20px; font-weight: bold; color: #171717; margin-bottom: 8px; }
      .report-header .date { font-size: 10px; color: #737373; }
      .report-section { margin-bottom: 20px; }
      .section-title { font-size: 14px; font-weight: bold; color: #171717; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e5e5; }
      .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
      .stat-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: #fafafa; border-radius: 8px; }
      .stat-label { font-size: 12px; color: #737373; }
      .stat-value { font-size: 16px; font-weight: bold; }
      .chart-container { margin: 10px 0; background: #fafafa; border-radius: 8px; padding: 10px; }
      .chart-container img { width: 100%; border-radius: 4px; }
      .pie-container { margin: 10px 0; background: #fafafa; border-radius: 8px; padding: 10px; }
      .pie-container img { width: 100%; border-radius: 4px; }
      .model-list { margin-top: 10px; }
      .model-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
      .model-name { font-size: 11px; color: #525252; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .model-stats { display: flex; gap: 15px; font-size: 11px; }
      .like { color: #22c55e; }
      .dislike { color: #ef4444; }
      .total { font-weight: bold; color: #171717; }
    </style>
    <div class="report-header">
      <h1>AI 助手反馈统计报告</h1>
      <div class="date">${new Date().toLocaleString('zh-CN')}</div>
    </div>
    
    <div class="report-section">
      <div class="section-title">统计概览</div>
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-label">总点赞数</span><span class="stat-value" style="color: #22c55e;">${stats.totalLikes}</span></div>
        <div class="stat-item"><span class="stat-label">总点踩数</span><span class="stat-value" style="color: #ef4444;">${stats.totalDislikes}</span></div>
        <div class="stat-item"><span class="stat-label">总反馈数</span><span class="stat-value" style="color: #171717;">${totalFeedback}</span></div>
        <div class="stat-item"><span class="stat-label">点赞率</span><span class="stat-value" style="color: #3b82f6;">${likeRate}%</span></div>
      </div>
    </div>
    
    <div class="report-section">
      <div class="section-title">赞踩趋势</div>
      <div class="chart-container">
        <img src="${chartDataUrl}" alt="趋势图" />
      </div>
    </div>
    
    <div class="report-section">
      <div class="section-title">反馈原因分布</div>
      <div class="pie-container">
        <img src="${pieDataUrl}" alt="饼图" />
      </div>
    </div>
    
    <div class="report-section">
      <div class="section-title">模型分布</div>
      <div class="model-list">
        ${stats.modelDistribution.map(model => `
          <div class="model-item">
            <span class="model-name" title="${model.modelId}">${model.modelId.length > 20 ? model.modelId.substring(0, 20) + '...' : model.modelId}</span>
            <div class="model-stats">
              <span class="like">👍 ${model.likes}</span>
              <span class="dislike">👎 ${model.dislikes}</span>
              <span class="total">${model.total}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(container);

  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));

  const reportCanvas = await html2canvas(container, {
    scale: 1.5,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  document.body.removeChild(container);

  const imgData = reportCanvas.toDataURL('image/jpeg', 0.95);
  const imgWidth = reportCanvas.width;
  const imgHeight = reportCanvas.height;

  if (imgWidth === 0 || imgHeight === 0) {
    throw new Error('Failed to generate report image: empty canvas');
  }

  const pdfWidth = 595;
  const pdfHeight = 842;

  const scaleX = pdfWidth / imgWidth;
  const scaleY = pdfHeight / imgHeight;
  const scale = Math.min(scaleX, scaleY);

  const finalWidth = Math.max(1, Math.min(imgWidth * scale, pdfWidth));
  const finalHeight = Math.max(1, Math.min(imgHeight * scale, pdfHeight));

  const x = Math.max(0, (pdfWidth - finalWidth) / 2);
  const y = Math.max(0, (pdfHeight - finalHeight) / 2);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [pdfWidth, pdfHeight],
  });

  doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

  const filename = `反馈统计报告_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
