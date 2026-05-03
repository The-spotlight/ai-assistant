'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

export const NOTE_COLORS = {
  yellow: { 
    bg: '#FFFDF7', 
    border: '#F5E6D3', 
    text: '#8B6914', 
    light: '#FFFBF0',
    accent: '#E8C07D'
  },
  blue: { 
    bg: '#F8FAFF', 
    border: '#E2E8F0', 
    text: '#4A5568', 
    light: '#F5F8FF',
    accent: '#A0AEC0'
  },
  green: { 
    bg: '#F8FFF9', 
    border: '#E2F0E5', 
    text: '#4A6741', 
    light: '#F5FFF7',
    accent: '#90B77D'
  },
  pink: { 
    bg: '#FFFBFD', 
    border: '#F5E6EF', 
    text: '#8B5A7A', 
    light: '#FFF7FC',
    accent: '#D4A5C0'
  },
  purple: { 
    bg: '#FBFAFF', 
    border: '#EDE9F5', 
    text: '#6B5A8B', 
    light: '#F9F7FF',
    accent: '#B4A5D4'
  },
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

const DEFAULT_NOTE_SIZE = { width: 300, height: 220 };

function getDefaultPosition(index: number) {
  if (typeof window === 'undefined') {
    return { x: 400 + index * 20, y: 80 + index * 20 };
  }
  return {
    x: Math.max(20, window.innerWidth - 380) + index * 20,
    y: 80 + index * 20,
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
