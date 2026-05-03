'use client';

import { Modal } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import { X, Check, Sparkles, Package, Eye, Clock, ChevronRight } from 'lucide-react';
import {
  CURRENT_VERSION,
  CHANGELOG_DATA,
  UPDATE_TYPE_LABELS,
  isVersionNew,
  saveReadVersion,
  getLatestVersion,
  type ChangelogEntry,
  type UpdateType,
} from '@/lib/changelog';

interface ChangelogPanelProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

const UPDATE_TYPE_DOT_COLORS: Record<UpdateType, string> = {
  feature: 'bg-[#16a34a]',
  fix: 'bg-[#dc2626]',
  improvement: 'bg-[#2563eb]',
};

function UpdateTypeTag({ type }: { type: UpdateType }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${UPDATE_TYPE_DOT_COLORS[type]}`} />
      <span className="text-xs text-[#737373] whitespace-nowrap">
        {UPDATE_TYPE_LABELS[type]}
      </span>
    </div>
  );
}

function ChangelogItem({ entry, isLatest, isNew }: { entry: ChangelogEntry; isLatest: boolean; isNew: boolean }) {
  const [markedAsRead, setMarkedAsRead] = useState(false);
  const [showMarkAsRead, setShowMarkAsRead] = useState(isLatest && isNew);

  const handleMarkAsRead = useCallback(() => {
    saveReadVersion(entry.version);
    setMarkedAsRead(true);
    setTimeout(() => {
      setShowMarkAsRead(false);
    }, 500);
  }, [entry.version]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#525252]" />
            <span className="text-sm font-medium text-[#171717]">
              v{entry.version}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#a3a3a3]" />
            <span className="text-xs text-[#737373]">
              {formatDate(entry.date)}
            </span>
          </div>
          {isLatest && isNew && !markedAsRead && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fefce8] text-[#854d0e] text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              <span>新版本</span>
            </div>
          )}
        </div>
        {showMarkAsRead && (
          <button
            type="button"
            onClick={handleMarkAsRead}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              markedAsRead 
                ? 'bg-[#f0fdf4] text-[#16a34a]' 
                : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'
            }`}
          >
            {markedAsRead ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已标记</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>不再显示此版本更新</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 ml-1.5 border-l-2 border-[#f5f5f5] pl-3">
        {entry.items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 py-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-[#a3a3a3] shrink-0 mt-0.5" />
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <UpdateTypeTag type={item.type} />
              <span className="text-xs text-[#525252] leading-relaxed">
                {item.content}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChangelogPanel({ open, onClose }: ChangelogPanelProps) {
  const [latestVersion, setLatestVersion] = useState<string>(CURRENT_VERSION);
  const [isLatestNew, setIsLatestNew] = useState(false);

  useEffect(() => {
    if (open) {
      const latest = getLatestVersion();
      setLatestVersion(latest);
      setIsLatestNew(isVersionNew(latest));
    }
  }, [open]);

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      styles={{
        body: { padding: 0 },
      }}
      closeIcon={
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#737373] transition-colors hover:bg-[#ebebeb] hover:text-[#171717]"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      }
    >
      <div className="flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#171717]" />
            <span className="text-sm font-semibold text-[#171717]">更新日志</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-[#737373]" />
            <span className="text-xs text-[#737373]">
              当前版本 v{CURRENT_VERSION}
            </span>
            {isLatestNew && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#fefce8] text-[#854d0e]">
                <Sparkles className="w-2.5 h-2.5" />
                <span className="text-xs font-medium">有更新</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-white">
          <div className="flex flex-col gap-6">
            {CHANGELOG_DATA.map((entry, index) => (
              <div key={entry.version}>
                {index > 0 && (
                  <div className="mb-6 h-px bg-[#f5f5f5]" />
                )}
                <ChangelogItem
                  entry={entry}
                  isLatest={index === 0}
                  isNew={isVersionNew(entry.version)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-3 border-t border-black/[0.06] bg-[#fafafa]">
          <p className="text-[10px] text-[#a3a3a3]">
            后续版本更新记录将在此处展示
          </p>
        </div>
      </div>
    </Modal>
  );
}
