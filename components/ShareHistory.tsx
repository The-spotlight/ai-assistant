'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TimestampFormatKey } from '@/lib/settings';

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

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
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

// 分享记录类型
interface ShareItem {
  shareId: string;
  shareUrl: string;
  title: string;
  expiresAt: string | null;
  hasPassword: boolean;
  createdAt: string;
  viewCount: number;
  lastViewedAt: string | null;
}

interface RecycleShareItem extends ShareItem {
  deletedAt: string | null;
}

// 组件属性
type ShareHistoryProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  deviceId: string;
  timestampFormat: TimestampFormatKey;
  formatTime: (dateStr: string, format: TimestampFormatKey) => string | null;
};

export default function ShareHistory({ isOpen, onClose, conversationId, deviceId, timestampFormat, formatTime }: ShareHistoryProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'recycle'>('active');
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [recycleShares, setRecycleShares] = useState<RecycleShareItem[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isLoadingRecycle, setIsLoadingRecycle] = useState(false);
  const [recycleError, setRecycleError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<string | null>(null);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);
  const [permanentDeleteError, setPermanentDeleteError] = useState<string | null>(null);

  // 获取分享列表
  const fetchShares = useCallback(async () => {
    try {
      setIsLoadingShares(true);
      const response = await fetch(`/api/conversations/${conversationId}/share`, {
        headers: { 'x-device-id': deviceId },
      });

      if (!response.ok) {
        throw new Error('获取分享列表失败');
      }

      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error('获取分享列表失败:', error);
    } finally {
      setIsLoadingShares(false);
    }
  }, [conversationId, deviceId]);

  // 获取回收区分享记录
  const fetchRecycleShares = useCallback(async () => {
    try {
      setIsLoadingRecycle(true);
      setRecycleError(null);
      const response = await fetch(`/api/conversations/${conversationId}/share?recycle=true`, {
        headers: { 'x-device-id': deviceId },
      });

      if (!response.ok) {
        throw new Error('获取回收区分享列表失败');
      }

      const data = await response.json();
      setRecycleShares(data);
    } catch (error) {
      console.error('获取回收区分享列表失败:', error);
      setRecycleError('获取回收区分享列表失败');
    } finally {
      setIsLoadingRecycle(false);
    }
  }, [conversationId, deviceId]);

  // 切换标签页时获取数据
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'active') {
        fetchShares();
      } else {
        fetchRecycleShares();
      }
    }
  }, [isOpen, activeTab, fetchShares, fetchRecycleShares]);

  // 复制历史分享链接
  const handleCopyHistoryShareUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(url);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('复制链接失败:', error);
    }
  }, []);

  // 删除分享记录
  const handleDeleteShare = useCallback((shareId: string) => {
    setShowDeleteConfirm(shareId);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async (shareId: string) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const response = await fetch(`/api/conversations/${conversationId}/share/${shareId}`, {
        method: 'DELETE',
        headers: {
          'x-device-id': deviceId,
        },
      });
      
      if (response.ok) {
        // 重新获取分享列表和回收区列表
        await fetchShares();
        await fetchRecycleShares();
        setShowDeleteConfirm(null);
      } else {
        setDeleteError('删除分享失败，请稍后重试');
        console.error('删除分享失败');
      }
    } catch (error) {
      setDeleteError('网络错误，请检查网络连接后重试');
      console.error('删除分享失败:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [conversationId, deviceId, fetchShares, fetchRecycleShares]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(null);
    setDeleteError(null);
  }, []);

  // 恢复分享记录
  const handleRestoreShare = useCallback(async (shareId: string) => {
    try {
      setIsRestoring(true);
      setRestoreError(null);
      const response = await fetch(`/api/conversations/${conversationId}/share/${shareId}/recycle`, {
        method: 'POST',
        headers: {
          'x-device-id': deviceId,
        },
      });
      
      if (response.ok) {
        // 重新获取分享列表和回收区列表
        await fetchShares();
        await fetchRecycleShares();
      } else {
        setRestoreError('恢复分享失败，请稍后重试');
        console.error('恢复分享失败');
      }
    } catch (error) {
      setRestoreError('网络错误，请检查网络连接后重试');
      console.error('恢复分享失败:', error);
    } finally {
      setIsRestoring(false);
    }
  }, [conversationId, deviceId, fetchShares, fetchRecycleShares]);

  // 永久删除分享记录
  const handlePermanentDeleteShare = useCallback((shareId: string) => {
    setShowPermanentDeleteConfirm(shareId);
    setPermanentDeleteError(null);
  }, []);

  const handleConfirmPermanentDelete = useCallback(async (shareId: string) => {
    try {
      setIsPermanentlyDeleting(true);
      setPermanentDeleteError(null);
      const response = await fetch(`/api/conversations/${conversationId}/share/${shareId}/recycle`, {
        method: 'DELETE',
        headers: {
          'x-device-id': deviceId,
        },
      });
      
      if (response.ok) {
        // 重新获取回收区列表
        await fetchRecycleShares();
        setShowPermanentDeleteConfirm(null);
      } else {
        setPermanentDeleteError('永久删除失败，请稍后重试');
        console.error('永久删除失败');
      }
    } catch (error) {
      setPermanentDeleteError('网络错误，请检查网络连接后重试');
      console.error('永久删除失败:', error);
    } finally {
      setIsPermanentlyDeleting(false);
    }
  }, [conversationId, deviceId, fetchRecycleShares]);

  const handleCancelPermanentDelete = useCallback(() => {
    setShowPermanentDeleteConfirm(null);
    setPermanentDeleteError(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white shadow-2xl max-h-[80vh] flex flex-col">
        {/* 顶部关闭按钮 */}
        <div className="flex justify-end p-4 border-b border-black/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
            title="关闭"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#171717]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">分享记录</h3>
          <p className="mb-6 text-center text-sm text-[#737373]">
            查看历史分享链接和访问统计
          </p>
          
          {/* 标签页 */}
          <div className="mt-6">
            <div className="flex border-b border-black/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('active');
                  fetchShares();
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'active' ? 'border-b-2 border-[#171717] text-[#171717]' : 'text-[#a3a3a3] hover:text-[#737373]'}`}
              >
                活跃分享
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recycle');
                  fetchRecycleShares();
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'recycle' ? 'border-b-2 border-[#171717] text-[#171717]' : 'text-[#a3a3a3] hover:text-[#737373]'}`}
              >
                回收区
              </button>
            </div>
            
            {/* 活跃分享 */}
            {activeTab === 'active' && (
              <div className="mt-4">
                {isLoadingShares ? (
                  <div className="flex justify-center py-4">
                    <IconLoader className="h-5 w-5 text-[#737373] animate-spin" />
                  </div>
                ) : shares.length === 0 ? (
                  <p className="text-center text-sm text-[#a3a3a3]">暂无分享记录</p>
                ) : (
                  <div className="space-y-3">
                    {shares.map((share) => (
                      <div key={share.shareId} className="flex flex-col rounded-lg border border-black/[0.08] p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#171717]">{share.title || '未命名对话'}</span>
                              <span className="inline-flex items-center gap-1 text-xs text-[#737373]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {share.viewCount}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#a3a3a3] mt-1">
                              <span>{share.expiresAt ? '限时' : '永久'}</span>
                              <span>·</span>
                              <span>分享于 {new Date(share.createdAt).toLocaleDateString('zh-CN')}</span>
                              <span>·</span>
                              <span>
                                {share.lastViewedAt ? `最近访问 ${formatTime(share.lastViewedAt, timestampFormat)}` : '暂未被访问'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyHistoryShareUrl(share.shareUrl)}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                copySuccess === share.shareUrl
                                  ? 'border-[#22c55e] bg-[#f0fdf4] text-[#22c55e]'
                                  : 'border-black/[0.08] bg-white text-[#171717] hover:bg-[#f5f5f5]'
                              }`}
                            >
                              {copySuccess === share.shareUrl ? (
                                <>
                                  <IconCheck className="h-3.5 w-3.5" />
                                </>
                              ) : (
                                <>
                                  <IconCopy className="h-3.5 w-3.5" />
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteShare(share.shareId)}
                              className="shrink-0 rounded-lg border border-black/[0.08] bg-white p-1.5 text-[#a3a3a3] transition hover:bg-red-50 hover:border-red-200 hover:text-[#ef4444]"
                              title="删除分享"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="truncate text-xs text-[#4d4d4d] mt-1">
                          {share.shareUrl}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* 回收区 */}
            {activeTab === 'recycle' && (
              <div className="mt-4">
                {isLoadingRecycle ? (
                  <div className="flex justify-center py-4">
                    <IconLoader className="h-5 w-5 text-[#737373] animate-spin" />
                  </div>
                ) : recycleError ? (
                  <p className="text-center text-sm text-[#ef4444]">{recycleError}</p>
                ) : recycleShares.length === 0 ? (
                  <p className="text-center text-sm text-[#a3a3a3]">回收区为空</p>
                ) : (
                  <div className="space-y-3">
                    {recycleShares.map((share) => (
                      <div key={share.shareId} className="flex flex-col rounded-lg border border-black/[0.08] p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#737373]">{share.title || '未命名对话'}</span>
                              <span className="inline-flex items-center gap-1 text-xs text-[#a3a3a3]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {share.viewCount}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#a3a3a3] mt-1">
                              <span>{share.expiresAt ? '限时' : '永久'}</span>
                              <span>·</span>
                              <span>分享于 {new Date(share.createdAt).toLocaleDateString('zh-CN')}</span>
                              <span>·</span>
                              <span>删除于 {share.deletedAt ? new Date(share.deletedAt).toLocaleDateString('zh-CN') : '-'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRestoreShare(share.shareId)}
                              disabled={isRestoring}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                isRestoring
                                  ? 'border-black/[0.08] bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed'
                                  : 'border-[#22c55e] bg-[#f0fdf4] text-[#22c55e] hover:bg-[#dcfce7]'
                              }`}
                            >
                              {isRestoring ? (
                                <div className="flex items-center gap-1">
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
                                  恢复中...
                                </div>
                              ) : (
                                '恢复'
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDeleteShare(share.shareId)}
                              className="shrink-0 rounded-lg border border-black/[0.08] bg-white p-1.5 text-[#a3a3a3] transition hover:bg-red-50 hover:border-red-200 hover:text-[#ef4444]"
                              title="永久删除"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="truncate text-xs text-[#a3a3a3] mt-1">
                          {share.shareUrl}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 删除确认模态框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.08] bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex justify-center">
                <IconAlertCircle className="h-10 w-10 text-[#ef4444]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">确认删除</h3>
              <p className="mb-4 text-center text-sm text-[#737373]">
                确定要删除此分享链接吗？删除后该链接将进入回收区，7天内可恢复。
              </p>
              {deleteError && (
                <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#ef4444]">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-sm font-medium text-[#171717] transition-colors hover:bg-[#f5f5f5]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(showDeleteConfirm)}
                  disabled={isDeleting}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isDeleting
                      ? 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed'
                      : 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <IconLoader className="h-4 w-4 animate-spin" />
                      删除中...
                    </>
                  ) : (
                    '删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 永久删除确认模态框 */}
      {showPermanentDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.08] bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex justify-center">
                <IconAlertCircle className="h-10 w-10 text-[#ef4444]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">确认永久删除</h3>
              <p className="mb-4 text-center text-sm text-[#737373]">
                确定要永久删除此分享链接吗？此操作不可恢复。
              </p>
              {permanentDeleteError && (
                <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#ef4444]">
                  {permanentDeleteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelPermanentDelete}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-sm font-medium text-[#171717] transition-colors hover:bg-[#f5f5f5]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmPermanentDelete(showPermanentDeleteConfirm)}
                  disabled={isPermanentlyDeleting}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isPermanentlyDeleting
                      ? 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed'
                      : 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                  }`}
                >
                  {isPermanentlyDeleting ? (
                    <>
                      <IconLoader className="h-4 w-4 animate-spin" />
                      删除中...
                    </>
                  ) : (
                    '永久删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
