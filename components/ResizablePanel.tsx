'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  onResize?: (width: number) => void;
  side?: 'left' | 'right';
  className?: string;
}

const LAYOUT_STORAGE_KEY = 'ai-assistant-layout';

function IconLayout(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M5 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 14h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconSave(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconTrash2(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export interface LayoutPreset {
  id: string;
  name: string;
  sidebarWidth: number;
  isSidebarVisible: boolean;
  createdAt: number;
}

export interface LayoutState {
  sidebarWidth: number;
  isSidebarVisible: boolean;
  presets: LayoutPreset[];
  activePresetId: string | null;
}

const DEFAULT_LAYOUT_STATE: LayoutState = {
  sidebarWidth: 260,
  isSidebarVisible: true,
  presets: [],
  activePresetId: null,
};

export function useLayoutState() {
  const [state, setState] = useState<LayoutState>(DEFAULT_LAYOUT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<LayoutState>;
        setState({
          ...DEFAULT_LAYOUT_STATE,
          ...parsed,
        });
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updateSidebarWidth = useCallback((width: number) => {
    setState((prev) => ({
      ...prev,
      sidebarWidth: width,
      activePresetId: null,
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSidebarVisible: !prev.isSidebarVisible,
      activePresetId: null,
    }));
  }, []);

  const savePreset = useCallback((name: string) => {
    const preset: LayoutPreset = {
      id: `preset-${Date.now()}`,
      name,
      sidebarWidth: state.sidebarWidth,
      isSidebarVisible: state.isSidebarVisible,
      createdAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      presets: [...prev.presets, preset],
      activePresetId: preset.id,
    }));
    return preset;
  }, [state.sidebarWidth, state.isSidebarVisible]);

  const loadPreset = useCallback((presetId: string) => {
    setState((prev) => {
      const preset = prev.presets.find((p) => p.id === presetId);
      if (!preset) return prev;
      return {
        ...prev,
        sidebarWidth: preset.sidebarWidth,
        isSidebarVisible: preset.isSidebarVisible,
        activePresetId: presetId,
      };
    });
  }, []);

  const deletePreset = useCallback((presetId: string) => {
    setState((prev) => ({
      ...prev,
      presets: prev.presets.filter((p) => p.id !== presetId),
      activePresetId:
        prev.activePresetId === presetId ? null : prev.activePresetId,
    }));
  }, []);

  return {
    state,
    isLoaded,
    updateSidebarWidth,
    toggleSidebar,
    savePreset,
    loadPreset,
    deletePreset,
  };
}

interface ResizeHandleProps {
  onResizeStart: () => void;
  isResizing: boolean;
  side: 'left' | 'right';
}

function ResizeHandle({ onResizeStart, isResizing, side }: ResizeHandleProps) {
  return (
    <div
      className={`group relative z-10 flex cursor-col-resize items-center justify-center transition-colors ${
        isResizing ? 'bg-[#171717]/10' : 'hover:bg-[#171717]/5'
      }`}
      style={{
        width: '8px',
        marginLeft: side === 'right' ? '-4px' : 0,
        marginRight: side === 'left' ? '-4px' : 0,
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onResizeStart();
      }}
    >
      <div
        className={`flex h-8 items-center gap-0.5 rounded-full px-0.5 transition-colors ${
          isResizing
            ? 'bg-[#171717]/20'
            : 'bg-transparent group-hover:bg-[#171717]/10'
        }`}
      >
        <div className="h-3 w-0.5 rounded-full bg-[#171717]/20" />
        <div className="h-3 w-0.5 rounded-full bg-[#171717]/20" />
        <div className="h-3 w-0.5 rounded-full bg-[#171717]/20" />
      </div>
    </div>
  );
}

interface LayoutPresetsProps {
  layoutState: LayoutState;
  onLoadPreset: (id: string) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
}

function LayoutPresets({
  layoutState,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
}: LayoutPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsSaving(false);
        setNewPresetName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim());
      setNewPresetName('');
      setIsSaving(false);
    }
  };

  const activePreset = layoutState.presets.find(
    (p) => p.id === layoutState.activePresetId
  );

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
        title="布局预设"
      >
        <IconLayout className="h-3.5 w-3.5" />
        {activePreset ? (
          <span className="max-w-24 truncate">{activePreset.name}</span>
        ) : (
          <span>布局</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
          <div className="border-b border-black/[0.08] bg-[#fafafa] px-3 py-2">
            <h4 className="text-xs font-semibold text-[#171717]">布局预设</h4>
          </div>

          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onLoadPreset('default');
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-[#fafafa] ${
                !layoutState.activePresetId ? 'bg-[#fef3c7] text-[#92400e]' : 'text-[#737373]'
              }`}
            >
              <span className="flex items-center gap-2">
                {!layoutState.activePresetId && (
                  <IconCheck className="h-3 w-3" />
                )}
                默认布局
              </span>
              <span className="text-[10px] text-[#a3a3a3]">260px</span>
            </button>

            {layoutState.presets.length === 0 && !isSaving && (
              <div className="px-3 py-4 text-center text-xs text-[#a3a3a3]">
                暂无自定义预设
              </div>
            )}

            {layoutState.presets.map((preset) => (
              <div
                key={preset.id}
                className={`group flex items-center justify-between px-3 py-2 transition-colors hover:bg-[#fafafa] ${
                  layoutState.activePresetId === preset.id
                    ? 'bg-[#fef3c7]'
                    : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onLoadPreset(preset.id);
                    setIsOpen(false);
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-2 text-left text-xs ${
                    layoutState.activePresetId === preset.id
                      ? 'text-[#92400e]'
                      : 'text-[#737373]'
                  }`}
                >
                  {layoutState.activePresetId === preset.id && (
                    <IconCheck className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate">{preset.name}</span>
                  <span className="shrink-0 text-[10px] text-[#a3a3a3]">
                    {preset.sidebarWidth}px
                    {!preset.isSidebarVisible && ' (隐藏)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePreset(preset.id);
                  }}
                  className="ml-2 shrink-0 text-[#a3a3a3] opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  title="删除预设"
                >
                  <IconTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {isSaving ? (
            <div className="flex items-center gap-2 border-t border-black/[0.08] p-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') {
                    setIsSaving(false);
                    setNewPresetName('');
                  }
                }}
                placeholder="预设名称"
                autoFocus
                className="flex-1 rounded-md border border-black/[0.08] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!newPresetName.trim()}
                className="shrink-0 rounded-md bg-[#171717] px-2 py-1.5 text-xs text-white transition-colors hover:bg-black disabled:opacity-40"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSaving(false);
                  setNewPresetName('');
                }}
                className="shrink-0 rounded-md px-2 py-1.5 text-xs text-[#737373] transition-colors hover:bg-[#f5f5f5]"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSaving(true)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-black/[0.08] px-3 py-2 text-xs text-[#737373] transition-colors hover:bg-[#fafafa] hover:text-[#171717]"
            >
              <IconSave className="h-3.5 w-3.5" />
              保存当前布局
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResizablePanel({
  children,
  defaultWidth = 260,
  minWidth = 200,
  maxWidth = 500,
  storageKey,
  onResize,
  side = 'left',
  className = '',
}: ResizablePanelProps) {
  const {
    state,
    isLoaded,
    updateSidebarWidth,
    toggleSidebar,
    savePreset,
    loadPreset,
    deletePreset,
  } = useLayoutState();

  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(state.sidebarWidth);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    startXRef.current = 0;
    startWidthRef.current = state.sidebarWidth;
  }, [state.sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (startXRef.current === 0) {
        startXRef.current = e.clientX;
        return;
      }

      const diff = side === 'left' 
        ? e.clientX - startXRef.current 
        : startXRef.current - e.clientX;
      const newWidth = Math.min(
        Math.max(startWidthRef.current + diff, minWidth),
        maxWidth
      );
      
      updateSidebarWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, side, minWidth, maxWidth, updateSidebarWidth, onResize]);

  const handleLoadPreset = (presetId: string) => {
    if (presetId === 'default') {
      updateSidebarWidth(defaultWidth);
    } else {
      loadPreset(presetId);
    }
  };

  if (!isLoaded) {
    return (
      <aside
        className={`mb-4 hidden min-h-0 shrink-0 flex-col self-stretch overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:mb-0 sm:mr-5 sm:flex ${className}`}
        style={{ width: defaultWidth }}
      >
        {children}
      </aside>
    );
  }

  return (
    <>
      {state.isSidebarVisible && (
        <aside
          className={`mb-4 hidden min-h-0 shrink-0 flex-col self-stretch overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:mb-0 sm:mr-5 sm:flex ${className}`}
          style={{
            width: state.sidebarWidth,
            transition: isResizing ? 'none' : 'width 0.15s ease',
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <LayoutPresets
              layoutState={state}
              onLoadPreset={handleLoadPreset}
              onSavePreset={savePreset}
              onDeletePreset={deletePreset}
            />
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-lg px-2 py-1.5 text-xs text-[#a3a3a3] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
              title="隐藏侧边栏"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
          {children}
        </aside>
      )}

      {state.isSidebarVisible && (
        <ResizeHandle
          onResizeStart={handleResizeStart}
          isResizing={isResizing}
          side={side}
        />
      )}

      {!state.isSidebarVisible && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="mb-4 hidden h-full w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-black/[0.06] bg-white text-[#a3a3a3] transition-colors hover:bg-[#fafafa] hover:text-[#171717] sm:mb-0 sm:mr-5 sm:flex"
          title="显示侧边栏"
        >
          <IconLayout className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
