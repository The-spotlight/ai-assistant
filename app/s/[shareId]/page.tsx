import { prisma } from '@/lib/db';
import { isShareExpired } from '@/lib/share';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CopyLinkButton from '@/components/CopyLinkButton';
import ShareInteraction from '@/components/ShareInteraction';
import { DEFAULT_SETTINGS, THEME_PRESETS, FONT_SIZES, BUBBLE_STYLES, type ThemeKey } from '@/lib/theme-constants';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface SharePageData {
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

function IconArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
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

async function getShareData(shareId: string): Promise<SharePageData | null> {
  const share = await prisma.share.findUnique({
    where: { shareId },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!share) return null;
  if (isShareExpired(share.expiresAt)) return null;
  if (!share.conversation || share.conversation.isDeleted) return null;
  if (share.hasPassword) return null;

  // 记录访问信息
  try {
    const requestHeaders = await headers();
    const referrer = requestHeaders.get('referer') || undefined;
    const userAgent = requestHeaders.get('user-agent') || undefined;
    
    await prisma.shareView.create({
      data: {
        shareId,
        referrer,
        userAgent,
      },
    });
  } catch (error) {
    console.error('记录访问信息失败:', error);
    // 访问记录失败不影响分享内容的显示
  }

  return {
    shareId: share.shareId,
    title: share.title || share.conversation.title || '未命名对话',
    expiresAt: share.expiresAt?.toISOString() || null,
    createdAt: share.createdAt.toISOString(),
    conversation: {
      title: share.conversation.title,
      createdAt: share.conversation.createdAt.toISOString(),
      messages: share.conversation.messages.map((m) => ({
        id: m.clientMessageId ?? m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  
  try {
    const shareData = await getShareData(shareId);
    
    if (!shareData) {
      return {
        title: '分享不存在或已过期 - AI Assistant',
        description: '该分享链接不存在或已过期',
      };
    }

    const { conversation } = shareData;
    const firstMessage = conversation.messages[0];
    const preview = firstMessage ? firstMessage.content.slice(0, 150) : '';

    return {
      title: `${shareData.title} - AI Assistant 分享`,
      description: preview || '分享的 AI 对话',
    };
  } catch (e) {
    console.error('生成元数据失败:', e);
    return {
      title: 'AI Assistant 分享',
      description: '分享的 AI 对话',
    };
  }
}

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const defaultTheme = THEME_PRESETS[DEFAULT_SETTINGS.theme as ThemeKey];
  const defaultFontSize = FONT_SIZES[DEFAULT_SETTINGS.fontSize];
  const defaultBubbleStyle = BUBBLE_STYLES[DEFAULT_SETTINGS.bubbleStyle];

  let shareData: SharePageData | null = null;
  let error: string | null = null;

  try {
    shareData = await getShareData(shareId);
    if (!shareData) {
      error = '分享链接不存在或已过期';
    }
  } catch (e) {
    console.error('获取分享内容失败:', e);
    error = '加载分享内容失败，请稍后重试';
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/s/${shareId}`;

  if (error || !shareData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: defaultTheme.bgSecondary }}>
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
  const displayTitle = shareData.title;

  return (
    <div className="min-h-screen" style={{ backgroundColor: defaultTheme.bgSecondary }}>
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
            <CopyLinkButton url={shareUrl} />
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
                fontSize: defaultFontSize.value,
                lineHeight: defaultFontSize.lineHeight,
                backgroundColor: message.role === 'user' ? defaultTheme.userBubble : defaultTheme.aiBubble,
                color: message.role === 'user' ? defaultTheme.userText : defaultTheme.aiText,
              };

              return (
                <div
                  key={message.id}
                  className={`flex w-full gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } ${defaultBubbleStyle.spacing}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      message.role === 'user'
                        ? 'text-white'
                        : 'border bg-gradient-to-br from-[#f4f4f5] to-[#e4e4e7] text-[#525252]'
                    }`}
                    style={{
                      backgroundColor: message.role === 'user' ? defaultTheme.primary : undefined,
                      borderColor: defaultTheme.border,
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
                      } ${defaultBubbleStyle.padding}`}
                      style={{
                        ...messageBubbleStyle,
                        borderColor: message.role === 'assistant' ? defaultTheme.border : undefined,
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

        {/* 互动区域 */}
        <ShareInteraction shareId={shareId} />

        {/* 底部提示 */}
        <div className="mt-8 border-t border-black/[0.06] pt-6 text-center">
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
