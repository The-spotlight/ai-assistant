'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useQuickNotes,
  NOTE_COLORS,
  NOTE_COLOR_KEYS,
  type NoteColorKey,
  type QuickNote,
} from '@/lib/quick-notes';
import { StickyNote, Minus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

function NoteEditor({
  note,
  index,
}: {
  note: QuickNote;
  index: number;
}) {
  const { updateNote } = useQuickNotes();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      setIsComposing(false);
      updateNote(index, { content: e.currentTarget.value });
    },
    [index, updateNote]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isComposing) {
        updateNote(index, { content: e.target.value });
      }
    },
    [index, isComposing, updateNote]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        const textarea = e.currentTarget;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        const value = textarea.value;
        
        const beforeCursor = value.slice(0, selectionStart);
        const lines = beforeCursor.split('\n');
        const lastLine = lines[lines.length - 1];
        
        if (lastLine.startsWith('- ') || lastLine.startsWith('• ')) {
          e.preventDefault();
          const indent = lastLine.match(/^(\s*)[-•]\s/)?.[1] || '';
          const newLine = '\n' + indent + '• ';
          const newValue = value.slice(0, selectionStart) + newLine + value.slice(selectionEnd);
          updateNote(index, { content: newValue });
          
          setTimeout(() => {
            if (textareaRef.current) {
              const newPosition = selectionStart + newLine.length;
              textareaRef.current.selectionStart = newPosition;
              textareaRef.current.selectionEnd = newPosition;
              textareaRef.current.focus();
            }
          }, 0);
        }
      }
      
      if (e.key === 'Backspace') {
        const textarea = e.currentTarget;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        
        if (selectionStart === selectionEnd && selectionStart > 0) {
          const beforeCursor = textarea.value.slice(0, selectionStart);
          const lines = beforeCursor.split('\n');
          const lastLine = lines[lines.length - 1];
          
          if ((lastLine === '- ' || lastLine === '• ') || 
              (lastLine.match(/^\s*[-•]\s$/) && lastLine.trim() === '-')) {
            e.preventDefault();
            const lineStart = beforeCursor.lastIndexOf('\n') + 1;
            const newValue = textarea.value.slice(0, lineStart) + textarea.value.slice(selectionStart);
            updateNote(index, { content: newValue });
            
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = lineStart;
                textareaRef.current.selectionEnd = lineStart;
                textareaRef.current.focus();
              }
            }, 0);
          }
        }
      }
    },
    [index, updateNote]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const selectionStart = textarea.selectionStart;
      const value = textarea.value;
      
      if (selectionStart >= 2) {
        const beforeCursor = value.slice(0, selectionStart);
        const lastTwoChars = beforeCursor.slice(-2);
        
        if (lastTwoChars === '- ') {
          const lineStart = beforeCursor.lastIndexOf('\n') + 1;
          const lineBeforeDash = beforeCursor.slice(lineStart, -2);
          
          if (lineBeforeDash.trim() === '' || lineBeforeDash === '') {
            const newValue = value.slice(0, selectionStart - 2) + '• ' + value.slice(selectionStart);
            updateNote(index, { content: newValue });
            
            setTimeout(() => {
              if (textareaRef.current) {
                const newPosition = selectionStart;
                textareaRef.current.selectionStart = newPosition;
                textareaRef.current.selectionEnd = newPosition;
                textareaRef.current.focus();
              }
            }, 0);
          }
        }
      }
    },
    [index, updateNote]
  );

  const colors = NOTE_COLORS[note.color];
  const placeholderText = '在这里写下你的想法...\n提示：输入 "- " 可以开始一个列表项';

  return (
    <textarea
      ref={textareaRef}
      value={note.content}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      placeholder={placeholderText}
      className="w-full h-full resize-none bg-transparent border-none outline-none px-4 py-3 text-sm leading-relaxed"
      style={{
        color: colors.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: '1.7',
      }}
    />
  );
}

function NoteDots({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {NOTE_COLOR_KEYS.map((colorKey, index) => {
        const colors = NOTE_COLORS[colorKey];
        const isActive = index === activeIndex;
        return (
          <button
            key={colorKey}
            type="button"
            onClick={() => onSelect(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              isActive ? '' : 'hover:opacity-70'
            }`}
            style={{
              backgroundColor: isActive ? colors.accent : colors.border,
              transform: isActive ? 'scale(1.3)' : 'scale(1)',
            }}
            aria-label={`切换到便签 ${index + 1}`}
            title={`便签 ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

function NoteFloatingWindow({
  note,
  index,
  onClose,
}: {
  note: QuickNote;
  index: number;
  onClose: () => void;
}) {
  const { updateNote, setActiveNoteIndex, activeNoteIndex, clearNote, notes } = useQuickNotes();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const colors = NOTE_COLORS[note.color];

  const handlePrevNote = useCallback(() => {
    const newIndex = (activeNoteIndex - 1 + NOTE_COLOR_KEYS.length) % NOTE_COLOR_KEYS.length;
    setActiveNoteIndex(newIndex);
  }, [activeNoteIndex, setActiveNoteIndex]);

  const handleNextNote = useCallback(() => {
    const newIndex = (activeNoteIndex + 1) % NOTE_COLOR_KEYS.length;
    setActiveNoteIndex(newIndex);
  }, [activeNoteIndex, setActiveNoteIndex]);

  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - note.position.x,
        y: e.clientY - note.position.y,
      });
    },
    [note.position]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: note.size.width,
        height: note.size.height,
      });
    },
    [note.size]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const clampedX = Math.max(20, Math.min(window.innerWidth - 120, newX));
      const clampedY = Math.max(20, Math.min(window.innerHeight - 120, newY));
      
      updateNote(index, {
        position: { x: clampedX, y: clampedY },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, index, updateNote]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(280, Math.min(500, resizeStart.width + deltaX));
      const newHeight = Math.max(160, Math.min(450, resizeStart.height + deltaY));
      
      updateNote(index, {
        size: { width: newWidth, height: newHeight },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, index, updateNote]);

  const handleMinimize = useCallback(() => {
    updateNote(index, { isMinimized: true });
  }, [index, updateNote]);

  const handleClear = useCallback(() => {
    if (note.content && confirm('确定要清空这张便签的内容吗？')) {
      clearNote(index);
    }
  }, [note.content, index, clearNote]);

  if (note.isMinimized) {
    return <MinimizedNote note={note} index={index} />;
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col rounded-xl shadow-lg transition-all duration-200"
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        height: note.size.height,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        ref={headerRef}
        className="flex items-center justify-between px-3 py-2.5 cursor-move select-none rounded-t-xl border-b"
        style={{
          backgroundColor: colors.light,
          borderBottomColor: colors.border,
        }}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevNote}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="上一张便签"
          >
            <ChevronLeft className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.6 }} />
          </button>
          <StickyNote className="w-4 h-4" style={{ color: colors.accent }} />
          <span
            className="text-xs font-medium"
            style={{ color: colors.text }}
          >
            便签 {index + 1}
          </span>
          <button
            type="button"
            onClick={handleNextNote}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="下一张便签"
          >
            <ChevronRight className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.6 }} />
          </button>
        </div>
        
        <NoteDots
          activeIndex={activeNoteIndex}
          onSelect={setActiveNoteIndex}
        />

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            title="清空内容"
            aria-label="清空便签内容"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.5 }} />
          </button>
          <button
            type="button"
            onClick={handleMinimize}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            title="最小化"
            aria-label="最小化便签"
          >
            <Minus className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.6 }} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            title="关闭便签"
            aria-label="关闭便签"
          >
            <X className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.6 }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <NoteEditor note={note} index={index} />
      </div>

      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${colors.border} 50%)`,
          borderRadius: '0 0 12px 0',
          opacity: 0.5,
        }}
        onMouseDown={handleResizeMouseDown}
        title="调整大小"
      />
    </div>
  );
}

function MinimizedNote({
  note,
  index,
}: {
  note: QuickNote;
  index: number;
}) {
  const { updateNote, setIsPanelOpen, setActiveNoteIndex } = useQuickNotes();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const colors = NOTE_COLORS[note.color];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - (note.minimizedPosition?.x ?? note.position.x),
        y: e.clientY - (note.minimizedPosition?.y ?? note.position.y),
      });
    },
    [note.minimizedPosition, note.position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const clampedX = Math.max(10, Math.min(window.innerWidth - 50, newX));
      const clampedY = Math.max(10, Math.min(window.innerHeight - 50, newY));
      
      updateNote(index, {
        minimizedPosition: { x: clampedX, y: clampedY },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, index, updateNote]);

  const handleRestore = useCallback(() => {
    updateNote(index, { isMinimized: false });
    setActiveNoteIndex(index);
    setIsPanelOpen(true);
  }, [index, updateNote, setActiveNoteIndex, setIsPanelOpen]);

  const position = note.minimizedPosition || note.position;
  const hasContent = note.content.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col items-center justify-center cursor-move select-none rounded-xl shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        width: 44,
        height: 44,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        type="button"
        onClick={handleRestore}
        className="relative w-full h-full flex items-center justify-center rounded-xl"
        aria-label="恢复便签"
      >
        <StickyNote className="w-5 h-5" style={{ color: colors.accent }} />
        {hasContent && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-medium"
            style={{
              backgroundColor: colors.accent,
              color: 'white',
            }}
          >
            {index + 1}
          </span>
        )}
      </button>
    </div>
  );
}

function NoteButton() {
  const { isPanelOpen, setIsPanelOpen, notes, activeNoteIndex } = useQuickNotes();
  
  const activeNote = notes[activeNoteIndex];
  const colors = NOTE_COLORS[activeNote?.color || 'yellow'];
  const hasAnyContent = notes.some((n) => n.content.trim().length > 0);

  const handleClick = useCallback(() => {
    if (!isPanelOpen) {
      notes.forEach((note, index) => {
        if (note.isMinimized) {
          updateNote(index, { isMinimized: false });
        }
      });
    }
    setIsPanelOpen(!isPanelOpen);
  }, [isPanelOpen, setIsPanelOpen, notes]);

  const { updateNote } = useQuickNotes();

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg"
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
      }}
      aria-label={isPanelOpen ? '关闭便签' : '打开便签'}
      title={isPanelOpen ? '关闭便签' : '打开便签'}
    >
      <StickyNote className="w-6 h-6" style={{ color: colors.accent }} />
      {hasAnyContent && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] font-medium text-white"
          style={{ backgroundColor: colors.accent, width: '18px', height: '18px' }}
        >
          {notes.filter((n) => n.content.trim().length > 0).length}
        </span>
      )}
    </button>
  );
}

export default function QuickNotes() {
  const { notes, activeNoteIndex, isPanelOpen, setIsPanelOpen } = useQuickNotes();
  const activeNote = notes[activeNoteIndex];

  const minimizedNotes = notes.filter((n) => n.isMinimized);
  const hasMinimizedNotes = minimizedNotes.length > 0;

  if (!isPanelOpen && !hasMinimizedNotes) {
    return <NoteButton />;
  }

  return (
    <>
      {!isPanelOpen && hasMinimizedNotes && (
        <NoteButton />
      )}
      
      {minimizedNotes.map((note) => {
        const noteIndex = notes.findIndex(n => n.id === note.id);
        return (
          <MinimizedNote
            key={`minimized-${note.id}`}
            note={note}
            index={noteIndex}
          />
        );
      })}
      
      {isPanelOpen && activeNote && (
        <NoteFloatingWindow
          key={activeNote.id}
          note={activeNote}
          index={activeNoteIndex}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </>
  );
}
