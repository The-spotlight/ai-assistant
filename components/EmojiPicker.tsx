'use client';

import { useState, useCallback, useMemo } from 'react';
import { emojiCategories, searchEmojis, type EmojiItem } from '@/lib/emoji-data';
import { X, Search, Clock } from 'lucide-react';

const RECENT_EMOJIS_KEY = 'ai-assistant-recent-emojis';
const MAX_RECENT_EMOJIS = 10;

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

function getRecentEmojis(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentEmoji(emoji: string): void {
  if (typeof window === 'undefined') return;
  const recent = getRecentEmojis();
  const filtered = recent.filter((e) => e !== emoji);
  const updated = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
  localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
}

export default function EmojiPicker({ visible, onClose, onSelectEmoji }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(getRecentEmojis);

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchEmojis(searchQuery);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onSelectEmoji(emoji);
      saveRecentEmoji(emoji);
      setRecentEmojis(getRecentEmojis());
    },
    [onSelectEmoji]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const renderEmojiGrid = (emojis: EmojiItem[] | string[], keyPrefix: string = 'emoji') => {
    return (
      <div className="grid grid-cols-8 gap-1">
        {emojis.map((item, index) => {
          const emoji = typeof item === 'string' ? item : item.emoji;
          const name = typeof item === 'string' ? emoji : item.name;
          return (
            <button
              key={`${keyPrefix}-${index}`}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded text-xl transition-colors hover:bg-[#f0f0f0] dark:hover:bg-[#3d3d3d]"
              title={name}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    );
  };

  if (!visible) return null;

  const categoriesToShow = isSearching
    ? [{ id: 'search', name: '搜索结果', emojis: filteredEmojis }]
    : [
        { id: 'recent', name: '最近使用', emojis: recentEmojis.map((e) => ({ emoji: e, name: e, keywords: [] })) },
        ...emojiCategories,
      ];

  const activeCategoryData = categoriesToShow.find((c) => c.id === activeCategory) || categoriesToShow[0];

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-30 mb-3 overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)] bg-white dark:bg-[#262626] shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      role="dialog"
      aria-label="表情选择"
    >
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] dark:border-white/10 bg-[#fafafa] dark:bg-[#171717] px-3 py-2">
        <h3 className="text-sm font-semibold text-[#171717] dark:text-white">表情</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#808080] transition-colors hover:bg-[#ebebeb] dark:hover:bg-[#3d3d3d] hover:text-[#171717] dark:hover:text-white"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3a3a3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索表情..."
            className="w-full h-9 pl-9 pr-3 text-sm border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-md bg-white dark:bg-[#171717] text-[#171717] dark:text-white placeholder:text-[#a3a3a3] focus:outline-none focus:ring-1 focus:ring-[#171717] dark:focus:ring-white"
          />
        </div>
      </div>

      <div className="flex border-b border-[rgba(0,0,0,0.08)] dark:border-white/10 overflow-x-auto">
        {categoriesToShow.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeCategory === category.id
                ? 'text-[#171717] dark:text-white border-[#171717] dark:border-white'
                : 'text-[#737373] dark:text-[#a3a3a3] border-transparent hover:text-[#171717] dark:hover:text-white'
            }`}
          >
            {category.id === 'recent' ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                最近
              </span>
            ) : (
              category.name
            )}
          </button>
        ))}
      </div>

      <div className="max-h-56 overflow-y-auto p-3">
        {activeCategoryData?.id === 'recent' && recentEmojis.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-[#a3a3a3]">
            暂无最近使用的表情
          </div>
        ) : activeCategoryData?.emojis.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-[#a3a3a3]">
            未找到匹配的表情
          </div>
        ) : (
          activeCategoryData && renderEmojiGrid(activeCategoryData.emojis, activeCategoryData.id)
        )}
      </div>

      {!isSearching && recentEmojis.length > 0 && activeCategory === 'recent' && (
        <div className="border-t border-[rgba(0,0,0,0.08)] dark:border-white/10 px-3 py-2">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">点击表情插入，面板保持打开以便连续选择</p>
        </div>
      )}
    </div>
  );
}
