'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useSettings,
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
} from '@/lib/settings';

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
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconSettings(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconRefreshCw(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function IconAlertTriangle(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings, resetSettings, themeColors } = useSettings();
  
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowResetConfirm(false);
      setResetSuccess(false);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showResetConfirm) {
          setShowResetConfirm(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose, showResetConfirm]);

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
    }, 2000);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-2">
            <IconSettings className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">外观设置</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#404040] transition-colors"
            aria-label="关闭"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {resetSuccess && (
          <div className="px-4 py-2 border-b border-black/[0.06] bg-[#f0fdf4] flex items-center gap-2 shrink-0">
            <IconCheck className="h-4 w-4 text-[#22c55e]" />
            <span className="text-xs text-[#16a34a]">已恢复默认外观</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#171717]">主题色</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(THEME_PRESETS) as [ThemeKey, typeof THEME_PRESETS[ThemeKey]][]).map(
                  ([key, theme]) => {
                    const isSelected = settings.theme === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSettings('theme', key)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#171717] bg-[#fafafa]'
                            : 'hover:bg-[#fafafa]'
                        }`}
                        title={theme.name}
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-black/[0.08] shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary} 50%, ${theme.secondary} 50%)`,
                          }}
                        />
                        <span className="text-[10px] text-[#525252]">{theme.name}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#171717]">消息字体大小</span>
              </div>
              <div className="flex gap-2">
                {(Object.entries(FONT_SIZES) as [FontSizeKey, typeof FONT_SIZES[FontSizeKey]][]).map(
                  ([key, size]) => {
                    const isSelected = settings.fontSize === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSettings('fontSize', key)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-[#171717] text-white'
                            : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        <span style={{ fontSize: size.value }}>{size.name}</span>
                        <span className="text-[10px] opacity-70">{size.value}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#171717]">代码块高亮方案</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(CODE_HIGHLIGHT_THEMES) as [CodeHighlightKey, typeof CODE_HIGHLIGHT_THEMES[CodeHighlightKey]][]).map(
                  ([key, theme]) => {
                    const isSelected = settings.codeHighlight === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSettings('codeHighlight', key)}
                        className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-[#171717] text-white'
                            : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        {isSelected && <IconCheck className="h-3.5 w-3.5" />}
                        {!isSelected && <div className="w-3.5 h-3.5" />}
                        <span>{theme.name}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#171717]">消息气泡样式</span>
              </div>
              <div className="flex gap-2">
                {(Object.entries(BUBBLE_STYLES) as [BubbleStyleKey, typeof BUBBLE_STYLES[BubbleStyleKey]][]).map(
                  ([key, style]) => {
                    const isSelected = settings.bubbleStyle === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateSettings('bubbleStyle', key)}
                        className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-lg transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#171717] bg-[#fafafa]'
                            : 'bg-[#fafafa] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        <div className="flex flex-col gap-1.5 w-full">
                          <div
                            className={`self-end ${
                              key === 'compact' ? 'px-2 py-1 rounded-lg max-w-[70%]' : 'px-3 py-2 rounded-xl max-w-[80%]'
                            } bg-[#171717]`}
                          >
                            <span
                              className="text-[11px] text-white block"
                              style={{ fontSize: FONT_SIZES[settings.fontSize].value }}
                            >
                              你好
                            </span>
                          </div>
                          <div
                            className={`self-start ${
                              key === 'compact' ? 'px-2 py-1 rounded-lg max-w-[70%]' : 'px-3 py-2 rounded-xl max-w-[80%]'
                            } bg-[#f5f5f5]`}
                          >
                            <span
                              className="text-[11px] text-[#171717] block"
                              style={{ fontSize: FONT_SIZES[settings.fontSize].value }}
                            >
                              你好！有什么可以帮助你的？
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#525252] font-medium">{style.name}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-black/[0.06] bg-[#fafafa] shrink-0">
          {showResetConfirm ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 bg-[#fef3c7] border border-[#fde68a] rounded-lg px-3 py-2.5">
                <IconAlertTriangle className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#92400e] font-medium">确认恢复默认外观？</p>
                  <p className="text-[10px] text-[#b45309] mt-0.5">所有自定义设置将被重置</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-[#525252] bg-white border border-black/[0.08] rounded-lg hover:bg-[#fafafa] transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-[#dc2626] rounded-lg hover:bg-[#b91c1c] transition-colors"
                >
                  确认恢复
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#525252] bg-white border border-black/[0.08] rounded-lg hover:bg-[#fafafa] transition-colors"
            >
              <IconRefreshCw className="h-4 w-4" />
              恢复默认外观
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center h-8 w-8 rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors"
      title="外观设置"
      aria-label="打开外观设置"
    >
      <IconSettings className="h-4 w-4" />
    </button>
  );
}
