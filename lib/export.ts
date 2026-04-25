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

export function conversationToMarkdown(
  conversation: ConversationExport,
  options?: { includeMetadata?: boolean }
): string {
  const { includeMetadata = true } = options || {};
  
  let markdown = '';
  
  const title = conversation.title?.trim() || '未命名对话';
  markdown += `# ${title}\n\n`;
  
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
  
  for (const message of conversation.messages) {
    if (message.role === 'system') continue;
    markdown += formatMessageForExport(message);
  }
  
  return markdown;
}

export async function createZipFromConversations(
  conversations: ConversationExport[]
): Promise<Uint8Array> {
  const zip = new JSZip();
  
  for (const conv of conversations) {
    const title = conv.title?.trim() || '未命名对话';
    const filename = `${sanitizeFilename(title)}.md`;
    const content = conversationToMarkdown(conv);
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
