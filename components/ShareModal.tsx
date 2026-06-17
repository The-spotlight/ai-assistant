'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Share2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

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
          <Button variant="ghost" size="icon" onClick={handleClose} title="关闭">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6">
          {shareError ? (
            <>
              <div className="mb-4 flex justify-center">
                <AlertCircle className="h-12 w-12 text-[#ef4444]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享失败</h3>
              <p className="mb-6 text-center text-sm text-[#737373]">{shareError}</p>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShareError(null)}>
                  重试
                </Button>
              </div>
            </>
          ) : shareUrl ? (
            <>
              <div className="mb-4 flex justify-center">
                <Share2 className="h-12 w-12 text-[#171717]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享链接已生成</h3>
              <p className="mb-4 text-center text-sm text-[#737373]">
                任何人都可以通过以下链接查看此对话（只读）
              </p>
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-black/[0.08] bg-[#fafafa] p-3">
                <span className="min-w-0 flex-1 truncate text-sm text-[#171717]">{shareUrl}</span>
                <Button
                  variant={copied ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleCopyShareUrl}
                  className={copied ? 'bg-[#f0fdf4] text-[#22c55e] border-[#22c55e]' : ''}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      复制
                    </>
                  )}
                </Button>
              </div>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => resetState()}>
                  <Share2 className="h-4 w-4" />
                  创建新分享
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <Share2 className="h-12 w-12 text-[#171717]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享对话</h3>
              <p className="mb-6 text-center text-sm text-[#737373]">
                创建一个可共享的链接，让其他人查看此对话
              </p>
              
              {/* 有效期选择 */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-[#171717]">有效期</label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={expiry === '7d' ? 'default' : 'outline'}
                    onClick={() => setExpiry('7d')}
                  >
                    7天
                  </Button>
                  <Button
                    variant={expiry === '30d' ? 'default' : 'outline'}
                    onClick={() => setExpiry('30d')}
                  >
                    30天
                  </Button>
                  <Button
                    variant={expiry === 'forever' ? 'default' : 'outline'}
                    onClick={() => setExpiry('forever')}
                  >
                    永久
                  </Button>
                </div>
              </div>
              
              {/* 分享按钮 */}
              <Button className="w-full" onClick={handleShare} disabled={isSharing || messagesLength === 0}>
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    分享中…
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    生成分享链接
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
