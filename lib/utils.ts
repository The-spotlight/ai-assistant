import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';
  
  let result = markdown;
  
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/^```\w*\n/, '').replace(/```$/, '').trim();
  });
  
  result = result.replace(/`([^`]+)`/g, '$1');
  
  result = result.replace(/^###?\s+/gm, '');
  result = result.replace(/^#{1,6}\s+/gm, '');
  
  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/\*([^*]+)\*/g, '$1');
  result = result.replace(/___([^_]+)___/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');
  result = result.replace(/_([^_]+)_/g, '$1');
  
  result = result.replace(/~~([^~]+)~~/g, '$1');
  
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  result = result.replace(/<([^>]+)>/g, '$1');
  
  result = result.replace(/^[-*+]\s+/gm, '• ');
  result = result.replace(/^\d+\.\s+/gm, '');
  
  result = result.replace(/^\s*>\s+/gm, '');
  
  result = result.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

export function toQuoteFormat(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  return lines
    .map(line => `> ${line}`)
    .join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
}
