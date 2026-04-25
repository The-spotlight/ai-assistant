'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLayoutContext } from '@/components/ResizablePanel';

type ConversationRow = {
  id: string;
  title: string | null;
  modelId: string | null;
  isPinned: boolean | null;
  pinnedAt: string | null;
  orderIndex: number | null;
  createdAt: string;
  updatedAt: string;
};

interface ExportPanelProps {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationRow[];
  deviceId: string;
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconDownload(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconMinus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconPackage(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M7.5 4.21 2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9l-5.5-4.79" />
      <polyline points="7.5 16 3.27 13.55" />
      <polyline points="20.73 13.55 16.5 16 12.27 13.55" />
      <line x1="12" y1="22" x2="12" y2="13.55" />
      <path d="M16.5 7.6 12 11 7.5 7.6" />
      <line x1="12" y1="3.45" x2="12" y2="11" />
    </svg>
  );
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export default function ExportPanel({
  visible,
  onClose,
  conversations,
  deviceId,
}: ExportPanelProps) {
  const { widthCategory, sidebarWidth } = useLayoutContext();

  const isNarrow = widthCategory === 'narrow';
  const isWide = widthCategory === 'wide';

  const itemPadding = useMemo(() => {
    if (isNarrow) return 'px-2 py-2';
    if (isWide) return 'px-4 py-3';
    return 'px-3 py-2.5';
  }, [isNarrow, isWide]);

  const titleLines = useMemo(() => {
    if (isNarrow) return 'line-clamp-1';
    if (isWide) return 'line-clamp-2';
    return 'line-clamp-2';
  }, [isNarrow, isWide]);

  const showTime = !isNarrow;

  const panelRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.title?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const allSelected = filteredConversations.length > 0 && 
    filteredConversations.every(c => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected && 
    filteredConversations.some(c => selectedIds.has(c.id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    }
  }, [allSelected, filteredConversations]);

  const toggleSelectOne = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExportSelected = useCallback(async () => {
    if (selectedIds.size === 0 || isExporting) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/conversations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const timestamp = new Date().toISOString().slice(0, 10);
      let filename = `对话导出_${timestamp}.zip`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSelectedIds(new Set());
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  }, [selectedIds, deviceId, isExporting]);

  const handleExportAll = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/conversations/export', {
        method: 'GET',
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const timestamp = new Date().toISOString().slice(0, 10);
      let filename = `全部对话导出_${timestamp}.zip`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  }, [deviceId, isExporting]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible) {
      setSelectedIds(new Set());
      setSearchQuery('');
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconPackage className="h-4 w-4 text-[#737373]" />
            <span className="text-sm font-medium text-[#171717]">批量导出对话</span>
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#e5e5e5] text-[#737373]">
              {conversations.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#404040] transition-colors"
            aria-label="关闭"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-black/[0.06] bg-white">
          <p className="text-[11px] text-[#a3a3a3]">
            勾选需要导出的对话，将打包为 ZIP 文件下载，每个对话一个 .md 文件
          </p>
        </div>

        {/* 搜索框 */}
        <div className="px-4 py-3 border-b border-black/[0.06] bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconSearch className="h-4 w-4 text-[#a3a3a3]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索对话..."
              className="w-full pl-10 pr-10 py-2 text-sm bg-[#fafafa] border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20 placeholder:text-[#a3a3a3] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a3a3a3] hover:text-[#171717] transition-colors"
                aria-label="清除搜索"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 全选和操作按钮 */}
        {filteredConversations.length > 0 && (
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-black/[0.06] bg-white">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex h-4 w-4 items-center justify-center rounded border transition-colors"
                style={{
                  borderColor: allSelected || someSelected ? '#171717' : '#d4d4d4',
                  backgroundColor: allSelected || someSelected ? '#171717' : 'transparent',
                }}
              >
                {allSelected && <IconCheck className="h-2.5 w-2.5 text-white" />}
                {someSelected && <IconMinus className="h-2.5 w-2.5 text-white" />}
              </button>
              <span className="text-xs text-[#737373]">
                全选 {selectedIds.size > 0 && `(已选 ${selectedIds.size} 项)`}
              </span>
            </label>

            <div className="flex items-center gap-1.5">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleExportSelected}
                  disabled={isExporting}
                  className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#171717] transition-colors hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#171717]/20 border-t-[#171717]" />
                      导出中...
                    </>
                  ) : (
                    <>
                      <IconDownload className="h-3.5 w-3.5" />
                      导出选中
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleExportAll}
                disabled={isExporting}
                className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconDownload className="h-3.5 w-3.5" />
                导出全部
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              {searchQuery.trim() ? (
                <>
                  <IconSearch className="h-12 w-12 text-[#d4d4d4] mb-3" />
                  <p className="text-sm font-medium text-[#737373] mb-1">未找到匹配的会话</p>
                  <p className="text-xs text-[#a3a3a3]">尝试使用其他关键词</p>
                </>
              ) : (
                <>
                  <IconPackage className="h-12 w-12 text-[#d4d4d4] mb-3" />
                  <p className="text-sm font-medium text-[#737373] mb-1">暂无可导出的会话</p>
                  <p className="text-xs text-[#a3a3a3]">开始新对话后可以导出</p>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredConversations.map((c) => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors ${
                      isSelected ? 'border-[#171717] bg-[#fafafa]' : 'border-[#e5e5e5] bg-white hover:bg-[#fafafa]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => toggleSelectOne(c.id, e)}
                      className="flex w-8 shrink-0 items-center justify-center transition-colors hover:bg-[#f5f5f5]"
                      aria-label={isSelected ? '取消选择' : '选择'}
                    >
                      <div
                        className="flex h-4 w-4 items-center justify-center rounded border transition-colors"
                        style={{
                          borderColor: isSelected ? '#171717' : '#d4d4d4',
                          backgroundColor: isSelected ? '#171717' : 'transparent',
                        }}
                      >
                        {isSelected && <IconCheck className="h-2.5 w-2.5 text-white" />}
                      </div>
                    </button>

                    <div className={`min-w-0 flex-1 ${itemPadding}`}>
                      <span className={`${titleLines} text-[13px] font-medium leading-snug text-[#171717] ${
                        isNarrow ? 'text-[12px]' : ''
                      } ${isWide ? 'text-sm' : ''}`}>
                        {c.title?.trim() || '新对话'}
                      </span>
                      {showTime && (
                        <span className={`mt-1 block text-[11px] text-[#a3a3a3] ${
                          isWide ? 'text-xs' : ''
                        }`}>
                          {formatRelativeTime(c.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
