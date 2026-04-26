'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useSettings,
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  SEND_SHORTCUT_OPTIONS,
  TIMESTAMP_FORMAT_OPTIONS,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type SendShortcutKey,
  type TimestampFormatKey,
} from '@/lib/settings';
import { OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';

type SettingsTab = 'appearance' | 'behavior' | 'model';

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

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const TAB_CONFIG: { key: SettingsTab; label: string; icon: typeof IconPalette }[] = [
  { key: 'appearance', label: '外观', icon: IconPalette },
  { key: 'behavior', label: '行为', icon: IconMousePointerClick },
  { key: 'model', label: '模型', icon: IconBot },
];

export default function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
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
