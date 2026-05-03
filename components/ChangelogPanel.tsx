'use client';

import { Modal } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import { X, Check, Sparkles, Package, Eye, Clock } from 'lucide-react';
import {
  CURRENT_VERSION,
  CHANGELOG_DATA,
  UPDATE_TYPE_LABELS,
  UPDATE_TYPE_COLORS,
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

function UpdateTypeTag({ type }: { type: UpdateType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${UPDATE_TYPE_COLORS[type]}`}>
      {UPDATE_TYPE_LABELS[type]}
    </span>
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
    <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${
      isNew && isLatest 
        ? 'border-blue-200 bg-blue-50/50 ring-1 ring-blue-100' 
        : 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${
            isLatest 
              ? 'bg-[#171717] text-white' 
              : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
          }`}>
            <Package className="w-3.5 h-3.5" />
            <span>v{entry.version}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDate(entry.date)}</span>
          </div>
          {isLatest && isNew && !markedAsRead && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>新版本</span>
            </div>
          )}
        </div>
        {showMarkAsRead && (
          <button
            type="button"
            onClick={handleMarkAsRead}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              markedAsRead 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
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

      <div className="flex flex-col gap-2">
        {entry.items.map((item, index) => (
          <div key={index} className="flex items-start gap-2.5">
            <UpdateTypeTag type={item.type} />
            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.content}
            </span>
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
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      }
    >
      <div className="flex flex-col max-h-[70vh]">
        <div className="flex flex-col gap-2 px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-gray-50 to-white dark:from-white/2 dark:to-white/1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#171717]" />
            <span className="text-sm font-semibold text-[#171717]">更新日志</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Package className="h-3.5 w-3.5" />
            <span>当前版本 v{CURRENT_VERSION}</span>
            {isLatestNew && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                <Sparkles className="h-2.5 w-2.5" />
                <span>有新版本更新</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-4">
            {CHANGELOG_DATA.map((entry, index) => (
              <ChangelogItem
                key={entry.version}
                entry={entry}
                isLatest={index === 0}
                isNew={isVersionNew(entry.version)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/1">
          <p className="text-xs text-gray-400">
            后续版本更新记录将在此处展示
          </p>
        </div>
      </div>
    </Modal>
  );
}
