'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useSettings, FONT_SIZES, BUBBLE_STYLES } from '@/lib/settings';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface ShareData {
  shareId: string;
  title: string;
  expiresAt: string | null;
  createdAt: string;
  conversation: {
    title: string | null;
    createdAt: string;
    messages: Message[];
  };
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function IconArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconShare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconAlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const { settings, themeColors, behavior } = useSettings();
  const bubbleStyle = BUBBLE_STYLES[settings.bubbleStyle];
  const fontSizeConfig = FONT_SIZES[settings.fontSize];

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadShareData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/share/${shareId}`);
        
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (response.status === 404) {
            setError(data.error || '分享链接不存在或已过期');
          } else if (response.status === 401 && data.requiresPassword) {
            setError('此分享需要密码访问');
          } else {
            setError(data.error || '加载分享内容失败');
          }
          return;
        }

        const data = (await response.json()) as ShareData;
        setShareData(data);
      } catch (e) {
        console.error('加载分享内容失败:', e);
        setError('加载分享内容失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    void loadShareData();
  }, [shareId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制链接失败:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-secondary, #f6f6f7)' }}>
        <div className="flex flex-col items-center gap-3">
          <IconLoader className="h-8 w-8 animate-spin text-[#171717]" />
          <p className="text-sm text-[#737373]">加载分享内容中...</p>
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: 'var(--theme-bg-secondary, #f6f6f7)' }}>
        <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex justify-center">
            <IconAlertCircle className="h-12 w-12 text-[#ef4444]" />
          </div>
          <h1 className="mb-2 text-lg font-semibold text-[#171717]">无法访问此分享</h1>
          <p className="mb-6 text-sm text-[#737373]">{error || '分享链接不存在或已过期'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
          >
            <IconArrowLeft className="h-4 w-4" />
            返回首页
          </a>
        </div>
      </div>
    );
  }

  const { conversation } = shareData;
  const displayTitle = shareData.title || conversation.title || '未命名对话';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-secondary, #f6f6f7)' }}>
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 border-b border-black/[0.06] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <IconShare className="h-5 w-5 text-[#171717]" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-medium text-[#171717]">{displayTitle}</h1>
              <p className="truncate text-xs text-[#a3a3a3]">
                {shareData.expiresAt 
                  ? `有效期至 ${new Date(shareData.expiresAt).toLocaleDateString('zh-CN')}`
                  : '永久分享'
                } · 分享于 {formatRelativeTime(shareData.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] transition hover:bg-[#fafafa]"
            >
              {copied ? (
                <>
                  <IconCheck className="h-3.5 w-3.5 text-[#22c55e]" />
                  已复制
                </>
              ) : (
                <>
                  <IconCopy className="h-3.5 w-3.5" />
                  复制链接
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 对话内容 */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {conversation.messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#737373]">此对话暂无消息</p>
          </div>
        ) : (
          <div className="space-y-6">
            {conversation.messages.map((message) => {
              const messageBubbleStyle = {
                fontSize: fontSizeConfig.value,
                lineHeight: fontSizeConfig.lineHeight,
                backgroundColor: message.role === 'user' ? themeColors.userBubble : themeColors.aiBubble,
                color: message.role === 'user' ? themeColors.userText : themeColors.aiText,
              };

              return (
                <div
                  key={message.id}
                  className={`flex w-full gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } ${bubbleStyle.spacing}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      message.role === 'user'
                        ? 'text-white'
                        : 'border bg-gradient-to-br from-[#f4f4f5] to-[#e4e4e7] text-[#525252]'
                    }`}
                    style={{
                      backgroundColor: message.role === 'user' ? themeColors.primary : undefined,
                      borderColor: themeColors.border,
                    }}
                  >
                    {message.role === 'user' ? '我' : 'AI'}
                  </div>
                  <div className="min-w-0 max-w-[min(100%,36rem)]">
                    <div
                      className={`min-w-0 relative ${
                        message.role === 'user'
                          ? 'rounded-2xl rounded-br-md'
                          : 'rounded-2xl rounded-tl-md border shadow-sm'
                      } ${bubbleStyle.padding}`}
                      style={{
                        ...messageBubbleStyle,
                        borderColor: message.role === 'assistant' ? themeColors.border : undefined,
                      }}
                    >
                      {message.role === 'assistant' && message.content ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                    <div className="mt-1.5 px-1">
                      <span className="text-[10px] text-[#a3a3a3]">
                        {formatRelativeTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-12 border-t border-black/[0.06] pt-6 text-center">
          <p className="text-xs text-[#a3a3a3]">
            内容由 AI 生成，仅供参考
          </p>
          <p className="mt-2 text-xs text-[#d4d4d4]">
            由 AI Assistant 分享
          </p>
        </div>
      </div>
    </div>
  );
}
