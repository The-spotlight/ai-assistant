'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, GripVertical } from 'lucide-react';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface OutlinePanelProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function OutlinePanel({ content, isOpen, onClose, containerRef }: OutlinePanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggingOffset, setDraggingOffset] = useState({ x: 0, y: 0 });
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const headings = useCallback((): Heading[] => {
    const regex = /^(#{1,6})\s+(.+)$/gm;
    const matches: Heading[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
      matches.push({ id, text, level });
    }
    return matches;
  }, [content]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: containerRect.width - 280,
      y: 100,
    });
  }, [isOpen, containerRef]);

  useEffect(() => {
    const handleScroll = () => {
      const headingsList = headings();
      if (headingsList.length === 0) return;

      let currentHeadingId: string | null = null;
      let maxOffset = -Infinity;

      headingsList.forEach((heading) => {
        const element = document.getElementById(`heading-${heading.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const offset = rect.top - 100;
          if (offset <= 0 && offset > maxOffset) {
            maxOffset = offset;
            currentHeadingId = heading.id;
          }
        }
      });

      if (currentHeadingId !== activeHeadingId) {
        setActiveHeadingId(currentHeadingId);
      }
    };

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, headings, activeHeadingId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    setDraggingOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - draggingOffset.x, containerRect.width - 260));
      const newY = Math.max(0, Math.min(e.clientY - draggingOffset.y, containerRect.height - 300));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingOffset, containerRef]);

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(`heading-${headingId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.scrollBy({ top: -50, behavior: 'smooth' });
    }
  };

  const outlineHeadings = headings();

  if (!isOpen || outlineHeadings.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 w-[260px] rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-shadow ${
        isDragging ? 'shadow-[0_12px_40px_rgba(0,0,0,0.16)] cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div
        className="flex items-center gap-2 border-b border-black/[0.06] px-4 py-3 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="h-4 w-4 text-[#a3a3a3]" />
        <span className="text-sm font-medium text-[#171717]">大纲</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded p-1 text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#171717] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {outlineHeadings.map((heading) => (
          <button
            key={heading.id}
            type="button"
            onClick={() => handleHeadingClick(heading.id)}
            className={`w-full text-left rounded px-3 py-1.5 text-sm transition-colors ${
              activeHeadingId === heading.id
                ? 'bg-[#fef3c7] text-[#92400e] font-medium'
                : 'text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]'
            }`}
            style={{
              paddingLeft: `${(heading.level - 1) * 12 + 12}px`,
            }}
          >
            {heading.text}
          </button>
        ))}
      </div>
    </div>
  );
}