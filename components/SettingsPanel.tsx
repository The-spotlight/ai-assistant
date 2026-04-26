'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useSettings,
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  SEND_SHORTCUT_OPTIONS,
  TIMESTAMP_FORMAT_OPTIONS,
  DEFAULT_SETTINGS,
  DEFAULT_BEHAVIOR_SETTINGS,
  DEFAULT_MODEL_SETTINGS,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type SendShortcutKey,
  type TimestampFormatKey,
  type AppearanceSettings,
  type BehaviorSettings,
  type ModelSettings,
} from '@/lib/settings';
import { OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';
import { getOrCreateDeviceId } from '@/lib/device';
import { downloadBlob } from '@/lib/export';

type SettingsTab = 'appearance' | 'behavior' | 'model' | 'data';

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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43-.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
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

function IconPalette(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function IconMousePointerClick(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M14 4.1 12 6" />
      <path d="m5.1 8 2.9 2" />
      <path d="M7 19l-5-5" />
      <path d="M15.2 7.4 21 12l-5.8 4.6-5.8-4.6L5.4 12l5.8-4.6z" />
    </svg>
  );
}

function IconBot(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function IconDatabase(props: React.SVGProps<SVGSVGElement>) {
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function IconDownload(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function IconUpload(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
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
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function IconFileJson(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 17h.01" />
      <path d="M14 17h.01" />
      <path d="M10 12h.01" />
      <path d="M14 12h.01" />
    </svg>
  );
}

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  onTrashEmptied?: () => void;
}

const TAB_CONFIG: { key: SettingsTab; label: string; icon: typeof IconPalette }[] = [
  { key: 'appearance', label: '外观', icon: IconPalette },
  { key: 'behavior', label: '行为', icon: IconMousePointerClick },
  { key: 'model', label: '模型', icon: IconBot },
  { key: 'data', label: '数据管理', icon: IconDatabase },
];

export default function SettingsPanel({ visible, onClose, onTrashEmptied }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    appearance,
    behavior,
    model,
    updateAppearance,
    updateBehavior,
    updateModel,
    resetAppearance,
    resetBehavior,
    resetModel,
    resetAll,
    themeColors,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setShowResetConfirm(false);
      setResetSuccess(null);
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

  const handleResetCurrentTab = () => {
    switch (activeTab) {
      case 'appearance':
        resetAppearance();
        setResetSuccess('外观');
        break;
      case 'behavior':
        resetBehavior();
        setResetSuccess('行为');
        break;
      case 'model':
        resetModel();
        setResetSuccess('模型');
        break;
      case 'data':
        setResetSuccess('数据管理');
        break;
    }
    setShowResetConfirm(false);
    setTimeout(() => {
      setResetSuccess(null);
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
            <span className="text-sm font-medium text-[#171717]">设置</span>
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

        <div className="flex items-center border-b border-black/[0.06] bg-white shrink-0">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors relative ${
                  isActive
                    ? 'text-[#171717]'
                    : 'text-[#737373] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#171717] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {resetSuccess && (
          <div className="px-4 py-2 border-b border-black/[0.06] bg-[#f0fdf4] flex items-center gap-2 shrink-0">
            <IconCheck className="h-4 w-4 text-[#22c55e]" />
            <span className="text-xs text-[#16a34a]">已恢复默认{resetSuccess}设置</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'appearance' && (
            <AppearanceTab
              appearance={appearance}
              updateAppearance={updateAppearance}
              themeColors={themeColors}
            />
          )}
          {activeTab === 'behavior' && (
            <BehaviorTab
              behavior={behavior}
              updateBehavior={updateBehavior}
            />
          )}
          {activeTab === 'model' && (
            <ModelTab
              model={model}
              updateModel={updateModel}
            />
          )}
          {activeTab === 'data' && (
            <DataTab
              appearance={appearance}
              behavior={behavior}
              model={model}
              updateAppearance={updateAppearance}
              updateBehavior={updateBehavior}
              updateModel={updateModel}
              onTrashEmptied={onTrashEmptied}
            />
          )}
        </div>

        <div className="px-4 py-3 border-t border-black/[0.06] bg-[#fafafa] shrink-0">
          {showResetConfirm ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 bg-[#fef3c7] border border-[#fde68a] rounded-lg px-3 py-2.5">
                <IconAlertTriangle className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#92400e] font-medium">确认恢复当前标签页的默认设置？</p>
                  <p className="text-[10px] text-[#b45309] mt-0.5">该标签页的所有自定义设置将被重置</p>
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
                  onClick={handleResetCurrentTab}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-[#dc2626] rounded-lg hover:bg-[#b91c1c] transition-colors"
                >
                  确认恢复
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#525252] bg-white border border-black/[0.08] rounded-lg hover:bg-[#fafafa] transition-colors"
              >
                <IconRefreshCw className="h-4 w-4" />
                恢复当前标签页
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setResetSuccess('全部');
                  setTimeout(() => setResetSuccess(null), 2000);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#525252] bg-white border border-black/[0.08] rounded-lg hover:bg-[#fafafa] transition-colors"
              >
                <IconRefreshCw className="h-4 w-4" />
                恢复全部
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppearanceTab({
  appearance,
  updateAppearance,
  themeColors,
}: {
  appearance: { theme: ThemeKey; fontSize: FontSizeKey; codeHighlight: CodeHighlightKey; bubbleStyle: BubbleStyleKey };
  updateAppearance: <K extends keyof typeof appearance>(key: K, value: typeof appearance[K]) => void;
  themeColors: typeof THEME_PRESETS[ThemeKey];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">主题色</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {(Object.entries(THEME_PRESETS) as [ThemeKey, typeof THEME_PRESETS[ThemeKey]][]).map(
            ([key, theme]) => {
              const isSelected = appearance.theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateAppearance('theme', key)}
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
              const isSelected = appearance.fontSize === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateAppearance('fontSize', key)}
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
              const isSelected = appearance.codeHighlight === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateAppearance('codeHighlight', key)}
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
              const isSelected = appearance.bubbleStyle === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateAppearance('bubbleStyle', key)}
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
                        style={{ fontSize: FONT_SIZES[appearance.fontSize].value }}
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
                        style={{ fontSize: FONT_SIZES[appearance.fontSize].value }}
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
  );
}

function BehaviorTab({
  behavior,
  updateBehavior,
}: {
  behavior: BehaviorSettings;
  updateBehavior: <K extends keyof BehaviorSettings>(key: K, value: BehaviorSettings[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">发送快捷键</span>
        </div>
        <div className="flex gap-2">
          {(Object.entries(SEND_SHORTCUT_OPTIONS) as [SendShortcutKey, typeof SEND_SHORTCUT_OPTIONS[SendShortcutKey]][]).map(
            ([key, option]) => {
              const isSelected = behavior.sendShortcut === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateBehavior('sendShortcut', key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {isSelected && <IconCheck className="h-4 w-4" />}
                  <span>{option.name}</span>
                </button>
              );
            }
          )}
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          {behavior.sendShortcut === 'enter'
            ? '按 Enter 发送消息，Shift+Enter 换行'
            : '按 Ctrl+Enter 发送消息，Enter 换行'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#171717]">显示 Token 统计</span>
          <button
            type="button"
            onClick={() => updateBehavior('showTokenStats', !behavior.showTokenStats)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              behavior.showTokenStats ? 'bg-[#171717]' : 'bg-[#d4d4d4]'
            }`}
            aria-checked={behavior.showTokenStats}
            role="switch"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                behavior.showTokenStats ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          控制对话顶部是否显示 Token 消耗和费用统计
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">消息时间戳格式</span>
        </div>
        <div className="flex gap-2">
          {(Object.entries(TIMESTAMP_FORMAT_OPTIONS) as [TimestampFormatKey, typeof TIMESTAMP_FORMAT_OPTIONS[TimestampFormatKey]][]).map(
            ([key, option]) => {
              const isSelected = behavior.timestampFormat === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateBehavior('timestampFormat', key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {isSelected && <IconCheck className="h-4 w-4" />}
                  <span>{option.name}</span>
                </button>
              );
            }
          )}
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          {behavior.timestampFormat === 'relative'
            ? '显示为"刚刚"、"5分钟前"等相对时间'
            : behavior.timestampFormat === 'absolute'
            ? '显示具体的日期和时间'
            : '不显示时间戳'}
        </p>
      </div>
    </div>
  );
}

function ModelTab({
  model,
  updateModel,
}: {
  model: ModelSettings;
  updateModel: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
}) {
  const handleTemperatureChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 2) {
      updateModel('temperature', num);
    }
  };

  const handleMaxTokensChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 128000) {
      updateModel('maxTokens', num);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">默认模型</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {OPENROUTER_MODEL_OPTIONS.map((option) => {
            const isSelected = model.defaultModel === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => updateModel('defaultModel', option.id)}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm transition-all text-left ${
                  isSelected
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5]'
                }`}
              >
                {isSelected && <IconCheck className="h-3.5 w-3.5 shrink-0" />}
                {!isSelected && <div className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          新对话将使用此模型，已有对话保持原模型
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#171717]">温度参数</span>
          <span className="text-sm font-mono text-[#525252]">{model.temperature.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={model.temperature}
            onChange={(e) => handleTemperatureChange(e.target.value)}
            className="flex-1 h-2 bg-[#e5e5e5] rounded-full appearance-none cursor-pointer accent-[#171717]"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={model.temperature}
              onChange={(e) => handleTemperatureChange(e.target.value)}
              className="w-16 h-8 px-2 text-sm text-center border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
            />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-[#a3a3a3]">
          <span>精确 (0.0)</span>
          <span>平衡 (1.0)</span>
          <span>创意 (2.0)</span>
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          控制输出随机性：越低越精确稳定，越高越有创意多变
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#171717]">最大 Token 限制</span>
          <span className="text-sm font-mono text-[#525252]">{model.maxTokens.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="256"
            max="32768"
            step="256"
            value={model.maxTokens}
            onChange={(e) => handleMaxTokensChange(e.target.value)}
            className="flex-1 h-2 bg-[#e5e5e5] rounded-full appearance-none cursor-pointer accent-[#171717]"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="128000"
              step="1"
              value={model.maxTokens}
              onChange={(e) => handleMaxTokensChange(e.target.value)}
              className="w-20 h-8 px-2 text-sm text-center border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
            />
          </div>
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          限制单次回复的最大 Token 数量，影响可生成的文本长度
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#171717]">流式输出</span>
          <button
            type="button"
            onClick={() => updateModel('streaming', !model.streaming)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              model.streaming ? 'bg-[#171717]' : 'bg-[#d4d4d4]'
            }`}
            aria-checked={model.streaming}
            role="switch"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                model.streaming ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          {model.streaming
            ? '逐字显示回复内容，提供更好的实时体验'
            : '等待完整回复后一次性显示，适合低速网络'}
        </p>
      </div>
    </div>
  );
}

interface DataValidationError {
  field: string;
  message: string;
}

interface DataTabProps {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  model: ModelSettings;
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  updateBehavior: <K extends keyof BehaviorSettings>(key: K, value: BehaviorSettings[K]) => void;
  updateModel: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
  onTrashEmptied?: () => void;
}

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  type: ToastType;
  message: string;
}

function DataTab({
  appearance,
  behavior,
  model,
  updateAppearance,
  updateBehavior,
  updateModel,
  onTrashEmptied,
}: DataTabProps) {
  const [exportingConversations, setExportingConversations] = useState(false);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [emptyingTrash, setEmptyingTrash] = useState(false);
  const [exportingConfig, setExportingConfig] = useState(false);
  const [importingConfig, setImportingConfig] = useState(false);
  const [importErrors, setImportErrors] = useState<DataValidationError[]>([]);
  const [trashCount, setTrashCount] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTrashCount = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const response = await fetch('/api/trash', {
          headers: {
            'x-device-id': deviceId,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTrashCount(data.conversations?.length || 0);
        }
      } catch (error) {
        console.error('Failed to fetch trash count:', error);
      }
    };
    fetchTrashCount();
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleExportConversations = async () => {
    setExportingConversations(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/conversations/export', {
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `全部对话导出_${timestamp}.zip`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('导出会话失败:', error);
      showToast('error', '导出失败，请稍后重试');
    } finally {
      setExportingConversations(false);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyingTrash(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/trash/empty', {
        method: 'POST',
        headers: {
          'x-device-id': deviceId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('清空回收站失败');
      }

      const data = await response.json();
      setTrashCount(0);
      setShowEmptyTrashConfirm(false);
      showToast('success', `已清空回收站，共删除 ${data.deletedCount} 个会话`);
      
      if (onTrashEmptied) {
        onTrashEmptied();
      }
    } catch (error) {
      console.error('清空回收站失败:', error);
      showToast('error', '清空失败，请稍后重试');
    } finally {
      setEmptyingTrash(false);
    }
  };

  const handleExportConfig = () => {
    setExportingConfig(true);
    try {
      const config = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        appearance,
        behavior,
        model,
      };

      const jsonString = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `配置备份_${timestamp}.json`;
      downloadBlob(blob, filename);
      showToast('success', '配置导出成功');
    } catch (error) {
      console.error('导出配置失败:', error);
      showToast('error', '导出失败，请稍后重试');
    } finally {
      setExportingConfig(false);
    }
  };

  const validateConfig = (data: unknown): { valid: boolean; errors: DataValidationError[]; parsedConfig?: any } => {
    const errors: DataValidationError[] = [];

    if (typeof data !== 'object' || data === null) {
      errors.push({ field: 'root', message: '配置文件格式无效，必须是一个对象' });
      return { valid: false, errors };
    }

    const config = data as any;

    if (config.version !== '1.0') {
      errors.push({ field: 'version', message: `不支持的版本号: ${config.version}，当前支持版本: 1.0` });
    }

    if (config.appearance && typeof config.appearance === 'object') {
      const appearanceConfig = config.appearance;
      
      if (appearanceConfig.theme !== undefined) {
        if (!(appearanceConfig.theme in THEME_PRESETS)) {
          errors.push({ 
            field: 'appearance.theme', 
            message: `无效的主题值: ${appearanceConfig.theme}，有效值: ${Object.keys(THEME_PRESETS).join(', ')}` 
          });
        }
      }

      if (appearanceConfig.fontSize !== undefined) {
        if (!(appearanceConfig.fontSize in FONT_SIZES)) {
          errors.push({ 
            field: 'appearance.fontSize', 
            message: `无效的字体大小: ${appearanceConfig.fontSize}，有效值: ${Object.keys(FONT_SIZES).join(', ')}` 
          });
        }
      }

      if (appearanceConfig.codeHighlight !== undefined) {
        if (!(appearanceConfig.codeHighlight in CODE_HIGHLIGHT_THEMES)) {
          errors.push({ 
            field: 'appearance.codeHighlight', 
            message: `无效的代码高亮主题: ${appearanceConfig.codeHighlight}，有效值: ${Object.keys(CODE_HIGHLIGHT_THEMES).join(', ')}` 
          });
        }
      }

      if (appearanceConfig.bubbleStyle !== undefined) {
        if (!(appearanceConfig.bubbleStyle in BUBBLE_STYLES)) {
          errors.push({ 
            field: 'appearance.bubbleStyle', 
            message: `无效的气泡样式: ${appearanceConfig.bubbleStyle}，有效值: ${Object.keys(BUBBLE_STYLES).join(', ')}` 
          });
        }
      }
    }

    if (config.behavior && typeof config.behavior === 'object') {
      const behaviorConfig = config.behavior;
      
      if (behaviorConfig.sendShortcut !== undefined) {
        if (!(behaviorConfig.sendShortcut in SEND_SHORTCUT_OPTIONS)) {
          errors.push({ 
            field: 'behavior.sendShortcut', 
            message: `无效的发送快捷键: ${behaviorConfig.sendShortcut}，有效值: ${Object.keys(SEND_SHORTCUT_OPTIONS).join(', ')}` 
          });
        }
      }

      if (behaviorConfig.showTokenStats !== undefined) {
        if (typeof behaviorConfig.showTokenStats !== 'boolean') {
          errors.push({ 
            field: 'behavior.showTokenStats', 
            message: 'showTokenStats 必须是布尔值' 
          });
        }
      }

      if (behaviorConfig.timestampFormat !== undefined) {
        if (!(behaviorConfig.timestampFormat in TIMESTAMP_FORMAT_OPTIONS)) {
          errors.push({ 
            field: 'behavior.timestampFormat', 
            message: `无效的时间戳格式: ${behaviorConfig.timestampFormat}，有效值: ${Object.keys(TIMESTAMP_FORMAT_OPTIONS).join(', ')}` 
          });
        }
      }
    }

    if (config.model && typeof config.model === 'object') {
      const modelConfig = config.model;
      const allowedModelIds = new Set(OPENROUTER_MODEL_OPTIONS.map(m => m.id));
      
      if (modelConfig.defaultModel !== undefined) {
        if (typeof modelConfig.defaultModel !== 'string' || !allowedModelIds.has(modelConfig.defaultModel)) {
          errors.push({ 
            field: 'model.defaultModel', 
            message: `无效的默认模型: ${modelConfig.defaultModel}` 
          });
        }
      }

      if (modelConfig.temperature !== undefined) {
        if (typeof modelConfig.temperature !== 'number' || modelConfig.temperature < 0 || modelConfig.temperature > 2) {
          errors.push({ 
            field: 'model.temperature', 
            message: 'temperature 必须是 0-2 之间的数字' 
          });
        }
      }

      if (modelConfig.maxTokens !== undefined) {
        if (typeof modelConfig.maxTokens !== 'number' || modelConfig.maxTokens < 1 || modelConfig.maxTokens > 128000) {
          errors.push({ 
            field: 'model.maxTokens', 
            message: 'maxTokens 必须是 1-128000 之间的整数' 
          });
        }
      }

      if (modelConfig.streaming !== undefined) {
        if (typeof modelConfig.streaming !== 'boolean') {
          errors.push({ 
            field: 'model.streaming', 
            message: 'streaming 必须是布尔值' 
          });
        }
      }
    }

    return { valid: errors.length === 0, errors, parsedConfig: config };
  };

  const applyConfig = (config: any) => {
    if (config.appearance && typeof config.appearance === 'object') {
      const appearanceConfig = config.appearance;
      
      if (appearanceConfig.theme && appearanceConfig.theme in THEME_PRESETS) {
        updateAppearance('theme', appearanceConfig.theme as ThemeKey);
      }
      if (appearanceConfig.fontSize && appearanceConfig.fontSize in FONT_SIZES) {
        updateAppearance('fontSize', appearanceConfig.fontSize as FontSizeKey);
      }
      if (appearanceConfig.codeHighlight && appearanceConfig.codeHighlight in CODE_HIGHLIGHT_THEMES) {
        updateAppearance('codeHighlight', appearanceConfig.codeHighlight as CodeHighlightKey);
      }
      if (appearanceConfig.bubbleStyle && appearanceConfig.bubbleStyle in BUBBLE_STYLES) {
        updateAppearance('bubbleStyle', appearanceConfig.bubbleStyle as BubbleStyleKey);
      }
    }

    if (config.behavior && typeof config.behavior === 'object') {
      const behaviorConfig = config.behavior;
      
      if (behaviorConfig.sendShortcut && behaviorConfig.sendShortcut in SEND_SHORTCUT_OPTIONS) {
        updateBehavior('sendShortcut', behaviorConfig.sendShortcut as SendShortcutKey);
      }
      if (typeof behaviorConfig.showTokenStats === 'boolean') {
        updateBehavior('showTokenStats', behaviorConfig.showTokenStats);
      }
      if (behaviorConfig.timestampFormat && behaviorConfig.timestampFormat in TIMESTAMP_FORMAT_OPTIONS) {
        updateBehavior('timestampFormat', behaviorConfig.timestampFormat as TimestampFormatKey);
      }
    }

    if (config.model && typeof config.model === 'object') {
      const modelConfig = config.model;
      const allowedModelIds = new Set(OPENROUTER_MODEL_OPTIONS.map(m => m.id));
      
      if (modelConfig.defaultModel && allowedModelIds.has(modelConfig.defaultModel)) {
        updateModel('defaultModel', modelConfig.defaultModel);
      }
      if (typeof modelConfig.temperature === 'number' && modelConfig.temperature >= 0 && modelConfig.temperature <= 2) {
        updateModel('temperature', modelConfig.temperature);
      }
      if (typeof modelConfig.maxTokens === 'number' && modelConfig.maxTokens >= 1 && modelConfig.maxTokens <= 128000) {
        updateModel('maxTokens', modelConfig.maxTokens);
      }
      if (typeof modelConfig.streaming === 'boolean') {
        updateModel('streaming', modelConfig.streaming);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingConfig(true);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        const { valid, errors, parsedConfig } = validateConfig(data);

        if (!valid) {
          setImportErrors(errors);
          setImportingConfig(false);
          return;
        }

        applyConfig(parsedConfig);
        showToast('success', '配置导入成功');
      } catch (error) {
        setImportErrors([{ field: 'root', message: 'JSON 解析失败，请检查文件格式' }]);
      } finally {
        setImportingConfig(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setImportErrors([{ field: 'root', message: '文件读取失败' }]);
      setImportingConfig(false);
    };
    reader.readAsText(file);
  };

  const handleImportConfig = () => {
    setImportErrors([]);
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 transition-all ${
          toast.type === 'success' 
            ? 'bg-[#f0fdf4] border-[#bbf7d0]' 
            : toast.type === 'error' 
            ? 'bg-[#fef2f2] border-[#fecaca]' 
            : 'bg-[#fafafa] border-black/[0.08]'
        }`}>
          {toast.type === 'success' && (
            <IconCheck className="h-4 w-4 text-[#22c55e] shrink-0" />
          )}
          {toast.type === 'error' && (
            <IconAlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0" />
          )}
          <span className={`text-xs font-medium ${
            toast.type === 'success' 
              ? 'text-[#16a34a]' 
              : toast.type === 'error' 
              ? 'text-[#dc2626]' 
              : 'text-[#525252]'
          }`}>
            {toast.message}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">会话数据</span>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExportConversations}
            disabled={exportingConversations}
            className="flex items-center justify-between gap-2 py-3 px-4 rounded-lg text-sm font-medium text-[#171717] bg-[#fafafa] border border-black/[0.08] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <IconDownload className="h-4 w-4 text-[#525252]" />
              <span>导出全部会话数据</span>
            </div>
            {exportingConversations && (
              <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
            )}
          </button>
          <p className="text-[11px] text-[#a3a3a3]">
            导出所有会话为 ZIP 压缩包，包含每个会话的 Markdown 文件
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">回收站管理</span>
          {trashCount !== null && (
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#e5e5e5] text-[#737373]">
              {trashCount} 项
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowEmptyTrashConfirm(true)}
            disabled={trashCount === 0 || emptyingTrash}
            className="flex items-center justify-between gap-2 py-3 px-4 rounded-lg text-sm font-medium text-[#171717] bg-[#fafafa] border border-black/[0.08] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <IconTrash2 className="h-4 w-4 text-[#525252]" />
              <span>一键清空回收站</span>
            </div>
            {emptyingTrash && (
              <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
            )}
          </button>
          <p className="text-[11px] text-[#a3a3a3]">
            永久删除回收站中的所有会话，此操作不可恢复
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">配置文件</span>
        </div>

        {importErrors.length > 0 && (
          <div className="flex flex-col gap-1 bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0" />
              <span className="text-xs text-[#dc2626] font-medium">配置文件校验失败</span>
            </div>
            <ul className="ml-6 text-[10px] text-[#b91c1c] list-disc">
              {importErrors.map((error, index) => (
                <li key={index}>
                  {error.field !== 'root' && <span className="font-mono">[{error.field}]</span>} {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportConfig}
              disabled={exportingConfig}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-[#171717] bg-[#fafafa] border border-black/[0.08] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconFileJson className="h-4 w-4 text-[#525252]" />
              <span>导出配置</span>
              {exportingConfig && (
                <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
              )}
            </button>
            <button
              type="button"
              onClick={handleImportConfig}
              disabled={importingConfig}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-[#171717] bg-[#fafafa] border border-black/[0.08] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconUpload className="h-4 w-4 text-[#525252]" />
              <span>导入配置</span>
              {importingConfig && (
                <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-[11px] text-[#a3a3a3]">
            导出当前配置为 JSON 文件，或从备份文件恢复设置。导入时会自动校验格式，无效字段不影响现有配置。
          </p>
        </div>
      </div>

      {showEmptyTrashConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-xs rounded-2xl border border-black/[0.08] bg-white p-5 shadow-lg">
            <div className="flex items-start gap-2 bg-[#fef3c7] border border-[#fde68a] rounded-lg px-3 py-2.5 mb-4">
              <IconAlertTriangle className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#92400e] font-medium">确认清空回收站？</p>
                <p className="text-[10px] text-[#b45309] mt-0.5">回收站中的所有会话将被永久删除</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEmptyTrashConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-[#525252] bg-white border border-black/[0.08] rounded-lg hover:bg-[#fafafa] transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleEmptyTrash}
                disabled={emptyingTrash}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-[#171717] rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emptyingTrash ? '清空中...' : '确认清空'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center h-8 w-8 rounded-lg text-[#a3a3a3] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors"
      title="设置"
      aria-label="打开设置"
    >
      <IconSettings className="h-4 w-4" />
    </button>
  );
}
