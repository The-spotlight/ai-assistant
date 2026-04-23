'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLayoutContext } from '@/components/ResizablePanel';

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconRotateCcw(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function IconAlertTriangle(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
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

type TrashedConversationRow = {
  id: string;
  title: string | null;
  modelId: string | null;
  isPinned: boolean | null;
  pinnedAt: string | null;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
};

interface TrashPanelProps {
  visible: boolean;
  onClose: () => void;
  trashList: TrashedConversationRow[];
  onRestore: (id: string, e: React.MouseEvent) => Promise<void>;
  onDeletePermanently: (id: string) => Promise<void>;
  onBatchRestore: (ids: string[]) => Promise<void>;
  onBatchDeletePermanently: (ids: string[]) => Promise<void>;
}

export default function TrashPanel({
  visible,
  onClose,
  trashList,
  onRestore,
  onDeletePermanently,
  onBatchRestore,
  onBatchDeletePermanently,
}: TrashPanelProps) {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState<string>('');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);

  const allSelected = trashList.length > 0 && selectedIds.size === trashList.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < trashList.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trashList.map(c => c.id)));
    }
  }, [allSelected, trashList]);

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

  const handleBatchRestore = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await onBatchRestore(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, onBatchRestore]);

  const handleBatchDeleteClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    setShowBatchDeleteConfirm(true);
  }, [selectedIds]);

  const handleConfirmBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await onBatchDeletePermanently(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowBatchDeleteConfirm(false);
  }, [selectedIds, onBatchDeletePermanently]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (showDeleteConfirm || showBatchDeleteConfirm) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setDeletingConversationId(null);
          setDeletingTitle('');
        } else if (showBatchDeleteConfirm) {
          setShowBatchDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose, showDeleteConfirm, showBatchDeleteConfirm]);

  useEffect(() => {
    if (!visible) {
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      setShowBatchDeleteConfirm(false);
    }
  }, [visible]);

  const handleDeleteClick = (conversationId: string, title: string | null) => {
    setDeletingConversationId(conversationId);
    setDeletingTitle(title?.trim() || '新对话');
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingConversationId) {
      await onDeletePermanently(deletingConversationId);
    }
    setShowDeleteConfirm(false);
    setDeletingConversationId(null);
    setDeletingTitle('');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
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
            <IconTrash className="h-4 w-4 text-[#737373]" />
            <span className="text-sm font-medium text-[#171717]">回收站</span>
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#e5e5e5] text-[#737373]">
              {trashList.length}
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

        <div className="px-4 py-2 border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-start gap-2">
            <IconAlertTriangle className="h-4 w-4 text-[#737373] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-medium text-[#525252]">删除后保留 7 天</p>
              <p className="text-[10px] text-[#a3a3a3]">可在 7 天内恢复，7 天后将永久删除</p>
            </div>
          </div>
        </div>

        {trashList.length > 0 && (
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

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleBatchRestore}
                  className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#171717] transition-colors hover:bg-[#f5f5f5]"
                >
                  <IconRotateCcw className="h-3.5 w-3.5" />
                  恢复
                </button>
                <button
                  type="button"
                  onClick={handleBatchDeleteClick}
                  className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                  删除
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {trashList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconTrash className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">回收站为空</p>
              <p className="text-xs text-[#a3a3a3]">删除的会话会显示在这里</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {trashList.map((c) => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors ${
                      isSelected ? 'border-[#171717] bg-[#fafafa]' : 'border-[#e5e5e5] bg-white'
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

                    <button
                      type="button"
                      className={`min-w-0 flex-1 ${itemPadding} text-left`}
                    >
                      <span className={`${titleLines} text-[13px] font-medium leading-snug text-[#737373] ${
                        isNarrow ? 'text-[12px]' : ''
                      } ${isWide ? 'text-sm' : ''}`}>
                        {c.title?.trim() || '新对话'}
                      </span>
                      {showTime && (
                        <span className={`mt-1 block text-[11px] text-[#a3a3a3] ${
                          isWide ? 'text-xs' : ''
                        }`}>
                          删除于 {formatRelativeTime(c.deletedAt)}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label="恢复会话"
                      onClick={(e) => onRestore(c.id, e)}
                      className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-[#f5f5f5] hover:text-[#171717] group-hover:opacity-100 ${
                        isNarrow ? 'w-7' : ''
                      }`}
                      title="恢复会话"
                    >
                      <IconRotateCcw className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                    </button>
                    <button
                      type="button"
                      aria-label="彻底删除"
                      onClick={() => handleDeleteClick(c.id, c.title)}
                      className={`flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-[#f5f5f5] hover:text-[#171717] group-hover:opacity-100 ${
                        isNarrow ? 'w-7' : ''
                      }`}
                      title="彻底删除（不可恢复）"
                    >
                      <IconTrash className={`h-4 w-4 ${isNarrow ? 'h-3.5 w-3.5' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && deletingConversationId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-xs rounded-2xl border border-black/[0.08] bg-white p-5 shadow-lg">
            <h3 className="mb-2 text-sm font-semibold text-[#171717]">彻底删除确认</h3>
            <p className="mb-5 text-sm text-[#737373]">
              确定要彻底删除「<span className="font-medium text-[#171717]">{deletingTitle}</span>」吗？
            </p>
            <p className="mb-5 text-xs text-[#a3a3a3]">
              此操作不可恢复，删除后将无法找回此会话。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingConversationId(null);
                  setDeletingTitle('');
                }}
                className="rounded-lg px-4 py-2 text-sm text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-[#171717] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                彻底删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-xs rounded-2xl border border-black/[0.08] bg-white p-5 shadow-lg">
            <h3 className="mb-2 text-sm font-semibold text-[#171717]">批量删除确认</h3>
            <p className="mb-5 text-sm text-[#737373]">
              确定要彻底删除选中的 <span className="font-medium text-[#171717]">{selectedIds.size}</span> 项吗？
            </p>
            <p className="mb-5 text-xs text-[#a3a3a3]">
              此操作不可恢复，删除后将无法找回这些会话。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBatchDeleteConfirm(false);
                }}
                className="rounded-lg px-4 py-2 text-sm text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="rounded-lg bg-[#171717] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                彻底删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
