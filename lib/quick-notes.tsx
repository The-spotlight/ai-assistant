'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

export const NOTE_COLORS = {
  yellow: { bg: '#FFF9C4', border: '#FDD835', text: '#5D4037', light: '#FFFDE7' },
  blue: { bg: '#BBDEFB', border: '#42A5F5', text: '#1565C0', light: '#E3F2FD' },
  green: { bg: '#C8E6C9', border: '#66BB6A', text: '#2E7D32', light: '#E8F5E9' },
  pink: { bg: '#F8BBD9', border: '#EC407A', text: '#AD1457', light: '#FCE4EC' },
  purple: { bg: '#E1BEE7', border: '#AB47BC', text: '#6A1B9A', light: '#F3E5F5' },
} as const;

export type NoteColorKey = keyof typeof NOTE_COLORS;

export const NOTE_COLOR_KEYS: NoteColorKey[] = ['yellow', 'blue', 'green', 'pink', 'purple'];

export interface QuickNote {
  id: string;
  content: string;
  color: NoteColorKey;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  minimizedPosition: { x: number; y: number } | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'ai-assistant-quick-notes';
const MAX_NOTES = 5;

const DEFAULT_NOTE_SIZE = { width: 320, height: 240 };

function getDefaultPosition(index: number) {
  if (typeof window === 'undefined') {
    return { x: 400 + index * 30, y: 100 + index * 30 };
  }
  return {
    x: Math.max(0, window.innerWidth - 400) + index * 30,
    y: 100 + index * 30,
  };
}

function getDefaultNotes(): QuickNote[] {
  const notes: QuickNote[] = [];
  for (let i = 0; i < MAX_NOTES; i++) {
    notes.push({
      id: `note-${i + 1}`,
      content: '',
      color: NOTE_COLOR_KEYS[i],
      position: getDefaultPosition(i),
      size: { ...DEFAULT_NOTE_SIZE },
      isMinimized: false,
      minimizedPosition: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return notes;
}

function loadNotesFromStorage(): QuickNote[] {
  try {
    if (typeof window === 'undefined') return getDefaultNotes();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const notes: QuickNote[] = [];
        for (let i = 0; i < MAX_NOTES; i++) {
          if (i < parsed.length) {
            const storedNote = parsed[i];
            notes.push({
              id: `note-${i + 1}`,
              content: storedNote.content || '',
              color: NOTE_COLOR_KEYS.includes(storedNote.color) ? storedNote.color : NOTE_COLOR_KEYS[i],
              position: storedNote.position || getDefaultPosition(i),
              size: storedNote.size || { ...DEFAULT_NOTE_SIZE },
              isMinimized: !!storedNote.isMinimized,
              minimizedPosition: storedNote.minimizedPosition || null,
              createdAt: storedNote.createdAt || new Date().toISOString(),
              updatedAt: storedNote.updatedAt || new Date().toISOString(),
            });
          } else {
            notes.push({
              id: `note-${i + 1}`,
              content: '',
              color: NOTE_COLOR_KEYS[i],
              position: getDefaultPosition(i),
              size: { ...DEFAULT_NOTE_SIZE },
              isMinimized: false,
              minimizedPosition: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
        return notes;
      }
    }
  } catch (e) {
    console.error('Failed to load notes from storage:', e);
  }
  return getDefaultNotes();
}

function saveNotesToStorage(notes: QuickNote[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes to storage:', e);
  }
}

interface QuickNotesContextValue {
  notes: QuickNote[];
  activeNoteIndex: number;
  isPanelOpen: boolean;
  updateNote: (index: number, updates: Partial<QuickNote>) => void;
  setActiveNoteIndex: (index: number) => void;
  setIsPanelOpen: (open: boolean) => void;
  clearNote: (index: number) => void;
}

const QuickNotesContext = createContext<QuickNotesContextValue | null>(null);

export function useQuickNotes(): QuickNotesContextValue {
  const context = useContext(QuickNotesContext);
  if (!context) {
    throw new Error('useQuickNotes must be used within a QuickNotesProvider');
  }
  return context;
}

interface QuickNotesProviderProps {
  children: ReactNode;
}

export function QuickNotesProvider({ children }: QuickNotesProviderProps) {
  const [notes, setNotes] = useState<QuickNote[]>(() => loadNotesFromStorage());
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  const updateNote = useCallback((index: number, updates: Partial<QuickNote>) => {
    setNotes((prev) => {
      const newNotes = [...prev];
      if (index >= 0 && index < newNotes.length) {
        newNotes[index] = {
          ...newNotes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return newNotes;
    });
  }, []);

  const clearNote = useCallback((index: number) => {
    updateNote(index, { content: '' });
  }, [updateNote]);

  const value: QuickNotesContextValue = {
    notes,
    activeNoteIndex,
    isPanelOpen,
    updateNote,
    setActiveNoteIndex,
    setIsPanelOpen,
    clearNote,
  };

  return (
    <QuickNotesContext.Provider value={value}>
      {children}
    </QuickNotesContext.Provider>
  );
}
