import JSZip from 'jszip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  modelDistribution: {
    modelId: string;
    likes: number;
    dislikes: number;
    total: number;
  }[];
  availableModels: string[];
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

  const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI 助手反馈统计报告</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; font-size: 12px; color: #171717; }
        .report-container { width: 210mm; min-height: 297mm; padding: 15mm; background: white; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 20px; font-weight: bold; color: #171717; margin-bottom: 8px; }
        .header .date { font-size: 10px; color: #737373; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: bold; color: #171717; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e5e5; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .stat-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: #fafafa; border-radius: 8px; }
        .stat-label { font-size: 12px; color: #737373; }
        .stat-value { font-size: 16px; font-weight: bold; }
        .chart-container { margin: 10px 0; background: #fafafa; border-radius: 8px; padding: 10px; }
        .pie-container { margin: 10px 0; background: #fafafa; border-radius: 8px; padding: 10px; }
        .model-list { margin-top: 10px; }
        .model-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        .model-name { font-size: 11px; color: #525252; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .model-stats { display: flex; gap: 15px; font-size: 11px; }
        .like { color: #22c55e; }
        .dislike { color: #ef4444; }
        .total { font-weight: bold; color: #171717; }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <h1>AI 助手反馈统计报告</h1>
          <div class="date">${new Date().toLocaleString('zh-CN')}</div>
        </div>
        
        <div class="section">
          <div class="section-title">统计概览</div>
          <div class="stats-grid">
            <div class="stat-item"><span class="stat-label">总点赞数</span><span class="stat-value" style="color: #22c55e;">${stats.totalLikes}</span></div>
            <div class="stat-item"><span class="stat-label">总点踩数</span><span class="stat-value" style="color: #ef4444;">${stats.totalDislikes}</span></div>
            <div class="stat-item"><span class="stat-label">总反馈数</span><span class="stat-value" style="color: #171717;">${totalFeedback}</span></div>
            <div class="stat-item"><span class="stat-label">点赞率</span><span class="stat-value" style="color: #3b82f6;">${likeRate}%</span></div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">赞踩趋势</div>
          <div class="chart-container" id="chart-placeholder"></div>
        </div>
        
        <div class="section">
          <div class="section-title">反馈原因分布</div>
          <div class="pie-container" id="pie-placeholder"></div>
        </div>
        
        <div class="section">
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
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.srcdoc = reportHtml;
  document.body.appendChild(iframe);

  await new Promise(resolve => {
    iframe.onload = resolve;
    setTimeout(resolve, 2000);
  });

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

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  const chartPlaceholder = iframeDoc?.getElementById('chart-placeholder');
  const piePlaceholder = iframeDoc?.getElementById('pie-placeholder');

  if (chartPlaceholder) {
    const chartImg = iframeDoc!.createElement('img');
    chartImg.src = chartCanvas.toDataURL('image/png');
    chartImg.style.width = '100%';
    chartImg.style.borderRadius = '4px';
    chartPlaceholder.appendChild(chartImg);
  }

  if (piePlaceholder) {
    const pieImg = iframeDoc!.createElement('img');
    pieImg.src = pieCanvas.toDataURL('image/png');
    pieImg.style.width = '100%';
    pieImg.style.borderRadius = '4px';
    piePlaceholder.appendChild(pieImg);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  const reportContainer = iframeDoc?.querySelector('.report-container') as HTMLElement | null;
  if (!reportContainer) {
    document.body.removeChild(iframe);
    throw new Error('Failed to find report container');
  }

  const reportCanvas = await html2canvas(reportContainer, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  document.body.removeChild(iframe);

  const imgData = reportCanvas.toDataURL('image/png');
  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = reportCanvas.width;
  const imgHeight = reportCanvas.height;

  const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const finalWidth = imgWidth * scale;
  const finalHeight = imgHeight * scale;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, (pdfHeight - finalHeight) / 2, finalWidth, finalHeight);

  const filename = `反馈统计报告_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
