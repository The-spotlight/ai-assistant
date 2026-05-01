'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronRight, Command } from 'lucide-react';
import {
  useCommandPalette,
  getAllCommands,
  filterCommands,
  type CommandItem,
} from '@/lib/command-palette';
import { cn } from '@/lib/utils';

export default function CommandPalette() {
  const { isOpen, close, customCommands, executeCommand } = useCommandPalette();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allCommands = getAllCommands(customCommands);
  const filteredCommands = filterCommands(allCommands, searchQuery);

  const resetState = useCallback(() => {
    setSearchQuery('');
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    } else if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          executeCommand(selectedCommand);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, filteredCommands, selectedIndex, executeCommand]);

  useEffect(() => {
    if (!listRef.current || !isOpen) return;
    
    const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  const handleCommandClick = (command: CommandItem) => {
    executeCommand(command);
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'quick-command':
        return '快捷指令';
      case 'skill':
        return '技能';
      case 'custom-command':
        return '自定义';
      default:
        return '命令';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={close}
      />
      
      <div className="relative z-10 w-full max-w-xl mx-4 overflow-hidden rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] bg-white/50">
          <Command className="h-5 w-5 text-[#737373]" />
          <div className="relative flex-1">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索命令、技能..."
              className="w-full bg-transparent pl-7 pr-4 py-1 text-sm text-[#171717] placeholder:text-[#a3a3a3] outline-none"
              autoFocus
            />
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-[#fafafa] px-1.5 py-0.5 text-[10px] text-[#737373] font-medium">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto"
        >
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#737373]">
              <Search className="h-8 w-8 mb-2 text-[#a3a3a3]" />
              <p className="text-sm">未找到匹配的命令</p>
              <p className="text-xs mt-1 text-[#a3a3a3]">
                尝试使用其他关键词搜索
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  type="button"
                  data-index={index}
                  onClick={() => handleCommandClick(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150',
                    selectedIndex === index
                      ? 'bg-[#f5f5f5]'
                      : 'hover:bg-[#fafafa]'
                  )}
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/80 border border-black/[0.06] text-xl">
                    {command.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#171717] truncate">
                        {command.label}
                      </span>
                      {command.command && (
                        <span className="shrink-0 text-xs text-[#a3a3a3] font-mono">
                          /{command.command}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#737373] truncate mt-0.5">
                      {command.description}
                    </p>
                    {command.example && (
                      <p className="text-xs text-[#a3a3a3] truncate mt-0.5 italic">
                        例如: {command.example}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium text-[#737373] bg-[#f5f5f5] rounded-full">
                      {getTypeLabel(command.type)}
                    </span>
                    {selectedIndex === index && (
                      <ChevronRight className="h-4 w-4 text-[#737373]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-black/[0.06] bg-[#fafafa]/50">
          <div className="flex items-center gap-4 text-[10px] text-[#a3a3a3]">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-black/[0.08] bg-white">↑</kbd>
              <kbd className="px-1 py-0.5 rounded border border-black/[0.08] bg-white">↓</kbd>
              <span>导航</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-black/[0.08] bg-white">↵</kbd>
              <span>执行</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-black/[0.08] bg-white">esc</kbd>
              <span>关闭</span>
            </span>
          </div>
          <span className="text-[10px] text-[#a3a3a3]">
            {filteredCommands.length} 个可用命令
          </span>
        </div>
      </div>
    </div>
  );
}
