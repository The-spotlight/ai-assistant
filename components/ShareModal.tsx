'use client';

import { useState, useCallback, useEffect } from 'react';

// 导入图标
function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconShare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconLoader(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function IconAlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// 有效期类型
type ExpiryOption = '7d' | '30d' | 'forever';

// 组件属性
type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  deviceId: string;
  messagesLength: number;
};

export default function ShareModal({ isOpen, onClose, conversationId, deviceId, messagesLength }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState<ExpiryOption>('forever');

  // 处理分享
  const handleShare = useCallback(async () => {
    if (messagesLength === 0) {
      setShareError('空对话无法分享');
      return;
    }

    try {
      setIsSharing(true);
      setShareError(null);

      // 转换过期时间格式
      let expiresInDays: number | undefined;
      if (expiry === '7d') {
        expiresInDays = 7;
      } else if (expiry === '30d') {
        expiresInDays = 30;
      }

      const response = await fetch(`/api/conversations/${conversationId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({ expiresInDays }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '创建分享失败');
      }

      const data = (await response.json()) as { shareUrl: string };
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('分享失败:', error);
      setShareError(error instanceof Error ? error.message : '创建分享失败');
    } finally {
      setIsSharing(false);
    }
  }, [conversationId, deviceId, messagesLength, expiry]);

  // 复制分享链接
  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制链接失败:', error);
    }
  }, [shareUrl]);

  // 重置状态
  const resetState = useCallback(() => {
    setShareUrl(null);
    setShareError(null);
    setCopied(false);
    setExpiry('forever');
  }, []);

  // 处理关闭
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  // 处理背景点击关闭
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleBackgroundClick}>
      <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* 顶部关闭按钮 */}
        <div className="flex justify-end p-4 border-b border-black/[0.06]">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
            title="关闭"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {shareError ? (
            <>
              <div className="mb-4 flex justify-center">
                <IconAlertCircle className="h-12 w-12 text-[#ef4444]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享失败</h3>
              <p className="mb-6 text-center text-sm text-[#737373]">{shareError}</p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShareError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-sm font-medium text-[#171717] transition-colors hover:bg-[#f5f5f5]"
                >
                  重试
                </button>
              </div>
            </>
          ) : shareUrl ? (
            <>
              <div className="mb-4 flex justify-center">
                <IconShare className="h-12 w-12 text-[#171717]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享链接已生成</h3>
              <p className="mb-4 text-center text-sm text-[#737373]">
                任何人都可以通过以下链接查看此对话（只读）
              </p>
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-black/[0.08] bg-[#fafafa] p-3">
                <span className="min-w-0 flex-1 truncate text-sm text-[#171717]">{shareUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    copied
                      ? 'border-[#22c55e] bg-[#f0fdf4] text-[#22c55e]'
                      : 'border-black/[0.08] bg-white text-[#171717] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {copied ? (
                    <>
                      <IconCheck className="h-3.5 w-3.5" />
                      已复制
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" />
                      复制
                    </>
                  )}
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    resetState();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-sm font-medium text-[#171717] transition-colors hover:bg-[#f5f5f5]"
                >
                  <IconShare className="h-4 w-4" />
                  创建新分享
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <IconShare className="h-12 w-12 text-[#171717]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享对话</h3>
              <p className="mb-6 text-center text-sm text-[#737373]">
                创建一个可共享的链接，让其他人查看此对话
              </p>
              
              {/* 有效期选择 */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-[#171717]">有效期</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setExpiry('7d')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      expiry === '7d'
                        ? 'border-[#171717] bg-[#171717] text-white'
                        : 'border-black/[0.08] bg-white text-[#171717] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    7天
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiry('30d')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      expiry === '30d'
                        ? 'border-[#171717] bg-[#171717] text-white'
                        : 'border-black/[0.08] bg-white text-[#171717] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    30天
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiry('forever')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      expiry === 'forever'
                        ? 'border-[#171717] bg-[#171717] text-white'
                        : 'border-black/[0.08] bg-white text-[#171717] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    永久
                  </button>
                </div>
              </div>
              
              {/* 分享按钮 */}
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing || messagesLength === 0}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isSharing
                    ? 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed'
                    : 'bg-[#171717] text-white hover:bg-[#000000]'
                }`}
              >
                {isSharing ? (
                  <>
                    <IconLoader className="h-4 w-4 animate-spin" />
                    分享中…
                  </>
                ) : (
                  <>
                    <IconShare className="h-4 w-4" />
                    生成分享链接
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
