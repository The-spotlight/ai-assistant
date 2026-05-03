'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SelectionToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSend: (question: string) => void;
}

export default function SelectionToolbar({
  selectedText,
  position,
  onClose,
  onSend,
}: SelectionToolbarProps) {
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const hasFocusedRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        const isClickOnInput = (e.target as HTMLElement).closest('input, textarea');
        if (isClickOnInput) {
          return;
        }

        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.toString().trim().length === 0) {
            onClose();
          }
        }, 0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSend = useCallback((customQuestion?: string) => {
    const finalQuestion = customQuestion || question.trim();
    const questionToSend = finalQuestion || '请解释这段内容';
    onSend(questionToSend);
  }, [question, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleInputClick = () => {
    if (inputRef.current && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const getToolbarPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const estimatedToolbarWidth = 360;
    const toolbarHeight = 44;

    let x = position.x - estimatedToolbarWidth / 2;
    let y = position.y - toolbarHeight - 8;

    if (x < 12) x = 12;
    if (x + estimatedToolbarWidth > viewportWidth - 12) {
      x = viewportWidth - estimatedToolbarWidth - 12;
    }

    if (y < 12) {
      y = position.y + 20;
    }
    if (y + toolbarHeight > viewportHeight - 12) {
      y = viewportHeight - toolbarHeight - 12;
    }

    return { x, y };
  };

  const toolbarPosition = getToolbarPosition();

  return (
    <div
      ref={toolbarRef}
      data-selection-toolbar
      className="fixed z-50 flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2 shadow-lg"
      style={{
        left: `${toolbarPosition.x}px`,
        top: `${toolbarPosition.y}px`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex-1 min-w-[160px] max-w-[280px]">
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          placeholder="输入问题，如：这段话是什么意思"
          className="w-full border-0 bg-transparent text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-0 cursor-text"
        />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="h-6 w-px bg-black/[0.08] mx-1" />
        <Button
          variant="default"
          size="sm"
          onClick={() => handleSend()}
          className="min-w-[60px] text-xs"
        >
          <Send className="h-3 w-3" />
          问 AI
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7"
          title="关闭"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
