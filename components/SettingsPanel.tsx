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
  AUTO_ARCHIVE_DAYS_OPTIONS,
  DEFAULT_SETTINGS,
  DEFAULT_BEHAVIOR_SETTINGS,
  DEFAULT_MODEL_SETTINGS,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type SendShortcutKey,
  type TimestampFormatKey,
  type AutoArchiveDaysKey,
  type AppearanceSettings,
  type BehaviorSettings,
  type ModelSettings,
  type SettingsPreset,
} from '@/lib/settings';
import { OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';
import { getOrCreateDeviceId } from '@/lib/device';
import { downloadBlob } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { CloseButton } from '@/components/ui/Dialog';
import { Switch } from '@/components/ui/Switch';
import { Toast } from '@/components/ui/Toast';
import {
  Settings,
  RefreshCw,
  AlertTriangle,
  Check,
  Palette,
  MousePointerClick,
  Bot,
  Database,
  Download,
  Upload,
  Trash2,
  FileJson,
  Layers,
  Save,
  Edit3,
  Keyboard,
} from 'lucide-react';

type SettingsTab = 'appearance' | 'behavior' | 'model' | 'keyboard' | 'presets' | 'data';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  onTrashEmptied?: () => void;
}

const TAB_CONFIG: { key: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'appearance', label: '外观', icon: Palette },
  { key: 'behavior', label: '行为', icon: MousePointerClick },
  { key: 'model', label: '模型', icon: Bot },
  { key: 'keyboard', label: '快捷键', icon: Keyboard },
  { key: 'presets', label: '配置方案', icon: Layers },
  { key: 'data', label: '数据管理', icon: Database },
];

export default function SettingsPanel({ visible, onClose, onTrashEmptied }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    appearance,
    behavior,
    model,
    keyboardShortcuts,
    updateAppearance,
    updateBehavior,
    updateModel,
    updateKeyboardShortcuts,
    resetAppearance,
    resetBehavior,
    resetModel,
    resetKeyboardShortcuts,
    resetAll,
    themeColors,
    presets,
    activePresetId,
    createPreset,
    applyPreset,
    renamePreset,
    deletePreset,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [presetSuccess, setPresetSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setShowResetConfirm(false);
      setResetSuccess(null);
      setPresetSuccess(null);
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
      case 'keyboard':
        resetKeyboardShortcuts();
        setResetSuccess('快捷键');
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
            <Settings className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">设置</span>
          </div>
          <CloseButton onClick={onClose} aria-label="关闭" />
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
            <Check className="h-4 w-4 text-[#22c55e]" />
            <span className="text-xs text-[#16a34a]">已恢复默认{resetSuccess}设置</span>
          </div>
        )}
        {presetSuccess && (
          <div className="px-4 py-2 border-b border-black/[0.06] bg-[#f0fdf4] flex items-center gap-2 shrink-0">
            <Check className="h-4 w-4 text-[#22c55e]" />
            <span className="text-xs text-[#16a34a]">{presetSuccess}</span>
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
          {activeTab === 'keyboard' && (
            <KeyboardTab
              keyboardShortcuts={keyboardShortcuts}
              updateKeyboardShortcuts={updateKeyboardShortcuts}
            />
          )}
          {activeTab === 'presets' && (
            <PresetsTab
              presets={presets}
              activePresetId={activePresetId}
              onCreatePreset={(name) => {
                createPreset(name);
                setPresetSuccess('配置方案已保存');
                setTimeout(() => setPresetSuccess(null), 2000);
              }}
              onApplyPreset={(id) => {
                applyPreset(id);
                setPresetSuccess('已切换到该配置方案');
                setTimeout(() => setPresetSuccess(null), 2000);
              }}
              onRenamePreset={(id, newName) => {
                renamePreset(id, newName);
                setPresetSuccess('配置方案已重命名');
                setTimeout(() => setPresetSuccess(null), 2000);
              }}
              onDeletePreset={(id) => {
                deletePreset(id);
                setPresetSuccess('配置方案已删除');
                setTimeout(() => setPresetSuccess(null), 2000);
              }}
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
                <AlertTriangle className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#92400e] font-medium">确认恢复当前标签页的默认设置？</p>
                  <p className="text-[10px] text-[#b45309] mt-0.5">该标签页的所有自定义设置将被重置</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowResetConfirm(false)}>
                  取消
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleResetCurrentTab}>
                  确认恢复
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowResetConfirm(true)}>
                <RefreshCw className="h-4 w-4" />
                恢复当前标签页
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                resetAll();
                setResetSuccess('全部');
                setTimeout(() => setResetSuccess(null), 2000);
              }}>
                <RefreshCw className="h-4 w-4" />
                恢复全部
              </Button>
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
                <Button
                  key={key}
                  variant={isSelected ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => updateAppearance('codeHighlight', key)}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 mr-1" />}
                  <span>{theme.name}</span>
                </Button>
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
                <Button
                  key={key}
                  variant={isSelected ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => updateBehavior('sendShortcut', key)}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                  <span>{option.name}</span>
                </Button>
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
          <Switch
            checked={behavior.showTokenStats}
            onCheckedChange={(checked) => updateBehavior('showTokenStats', checked)}
          />
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
                <Button
                  key={key}
                  variant={isSelected ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => updateBehavior('timestampFormat', key)}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                  <span>{option.name}</span>
                </Button>
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#171717]">自动归档</span>
          <Switch
            checked={behavior.autoArchive}
            onCheckedChange={(checked) => updateBehavior('autoArchive', checked)}
          />
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          超过指定天数没有新消息的对话自动移入回收站
        </p>
      </div>

      {behavior.autoArchive && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#171717]">归档天数</span>
          </div>
          <div className="flex gap-2">
            {Object.entries(AUTO_ARCHIVE_DAYS_OPTIONS).map(
              ([key, option]) => {
                const numKey = Number(key) as AutoArchiveDaysKey;
                const isSelected = behavior.autoArchiveDays === numKey;
                return (
                  <Button
                    key={key}
                    variant={isSelected ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateBehavior('autoArchiveDays', numKey)}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                    <span>{option.name}</span>
                  </Button>
                );
              }
            )}
          </div>
          <p className="text-[11px] text-[#a3a3a3]">
            超过 {AUTO_ARCHIVE_DAYS_OPTIONS[behavior.autoArchiveDays].name} 没有新消息的对话将自动移入回收站
          </p>
        </div>
      )}
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
              <Button
                key={option.id}
                variant={isSelected ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => updateModel('defaultModel', option.id)}
              >
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{option.label}</span>
              </Button>
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

function KeyboardTab({
  keyboardShortcuts,
  updateKeyboardShortcuts,
}: {
  keyboardShortcuts: any;
  updateKeyboardShortcuts: any;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState<string>('');

  const handleKeyDown = (e: React.KeyboardEvent, action: string) => {
    e.preventDefault();
    
    let shortcut = '';
    if (e.ctrlKey) shortcut += 'Ctrl+';
    if (e.shiftKey) shortcut += 'Shift+';
    if (e.altKey) shortcut += 'Alt+';
    
    const key = e.key.toUpperCase();
    if (key.length === 1 || ['Enter', 'Space', 'Tab', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      shortcut += key;
    }
    
    if (shortcut) {
      updateKeyboardShortcuts(action as any, shortcut);
      setEditingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">快捷键设置</span>
        </div>
        <p className="text-[11px] text-[#a3a3a3]">
          点击输入框后，按下想要设置的快捷键组合
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-[#525252]">新建对话</label>
          <div 
            className={`flex items-center gap-2 p-3 border border-black/[0.08] rounded-lg transition-all ${editingKey === 'newConversation' ? 'ring-2 ring-[#171717]' : 'hover:bg-[#fafafa]'}`}
            onKeyDown={(e) => editingKey === 'newConversation' && handleKeyDown(e, 'newConversation')}
            onClick={() => setEditingKey('newConversation')}
            tabIndex={0}
          >
            <span className="text-sm font-mono">{keyboardShortcuts.newConversation}</span>
            {editingKey === 'newConversation' && (
              <span className="text-xs text-[#a3a3a3]">请按下新的快捷键</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-[#525252]">发送消息</label>
          <div 
            className={`flex items-center gap-2 p-3 border border-black/[0.08] rounded-lg transition-all ${editingKey === 'sendMessage' ? 'ring-2 ring-[#171717]' : 'hover:bg-[#fafafa]'}`}
            onKeyDown={(e) => editingKey === 'sendMessage' && handleKeyDown(e, 'sendMessage')}
            onClick={() => setEditingKey('sendMessage')}
            tabIndex={0}
          >
            <span className="text-sm font-mono">{keyboardShortcuts.sendMessage}</span>
            {editingKey === 'sendMessage' && (
              <span className="text-xs text-[#a3a3a3]">请按下新的快捷键</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-[#525252]">切换 AI 模型</label>
          <div 
            className={`flex items-center gap-2 p-3 border border-black/[0.08] rounded-lg transition-all ${editingKey === 'switchModel' ? 'ring-2 ring-[#171717]' : 'hover:bg-[#fafafa]'}`}
            onKeyDown={(e) => editingKey === 'switchModel' && handleKeyDown(e, 'switchModel')}
            onClick={() => setEditingKey('switchModel')}
            tabIndex={0}
          >
            <span className="text-sm font-mono">{keyboardShortcuts.switchModel}</span>
            {editingKey === 'switchModel' && (
              <span className="text-xs text-[#a3a3a3]">请按下新的快捷键</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#171717]">会话数据</span>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={handleExportConversations}
            disabled={exportingConversations}
          >
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-[#525252]" />
              <span>导出全部会话数据</span>
            </div>
            {exportingConversations && (
              <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
            )}
          </Button>
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
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowEmptyTrashConfirm(true)}
            disabled={trashCount === 0 || emptyingTrash}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-[#525252]" />
              <span>一键清空回收站</span>
            </div>
            {emptyingTrash && (
              <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
            )}
          </Button>
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
              <AlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0" />
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleExportConfig}
              disabled={exportingConfig}
            >
              <FileJson className="h-4 w-4 text-[#525252]" />
              <span>导出配置</span>
              {exportingConfig && (
                <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleImportConfig}
              disabled={importingConfig}
            >
              <Upload className="h-4 w-4 text-[#525252]" />
              <span>导入配置</span>
              {importingConfig && (
                <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
              )}
            </Button>
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
              <AlertTriangle className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#92400e] font-medium">确认清空回收站？</p>
                <p className="text-[10px] text-[#b45309] mt-0.5">回收站中的所有会话将被永久删除</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEmptyTrashConfirm(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleEmptyTrash} disabled={emptyingTrash}>
                {emptyingTrash ? '清空中...' : '确认清空'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PresetsTabProps {
  presets: SettingsPreset[];
  activePresetId: string | null;
  onCreatePreset: (name: string) => void;
  onApplyPreset: (id: string) => void;
  onRenamePreset: (id: string, newName: string) => void;
  onDeletePreset: (id: string) => void;
}

type DialogMode = 'none' | 'create' | 'rename' | 'delete';

interface DialogState {
  mode: DialogMode;
  presetId: string | null;
  presetName: string;
}

function PresetsTab({
  presets,
  activePresetId,
  onCreatePreset,
  onApplyPreset,
  onRenamePreset,
  onDeletePreset,
}: PresetsTabProps) {
  const [dialog, setDialog] = useState<DialogState>({
    mode: 'none',
    presetId: null,
    presetName: '',
  });
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (dialog.mode !== 'none' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [dialog.mode]);

  const openCreateDialog = () => {
    setInputValue('');
    setDialog({
      mode: 'create',
      presetId: null,
      presetName: '',
    });
  };

  const openRenameDialog = (id: string, name: string) => {
    setInputValue(name);
    setDialog({
      mode: 'rename',
      presetId: id,
      presetName: name,
    });
  };

  const openDeleteDialog = (id: string, name: string) => {
    setDialog({
      mode: 'delete',
      presetId: id,
      presetName: name,
    });
  };

  const closeDialog = () => {
    setDialog({
      mode: 'none',
      presetId: null,
      presetName: '',
    });
    setInputValue('');
  };

  const handleConfirm = () => {
    switch (dialog.mode) {
      case 'create':
        if (inputValue.trim()) {
          onCreatePreset(inputValue.trim());
          closeDialog();
        }
        break;
      case 'rename':
        if (dialog.presetId && inputValue.trim()) {
          onRenamePreset(dialog.presetId, inputValue.trim());
          closeDialog();
        }
        break;
      case 'delete':
        if (dialog.presetId) {
          onDeletePreset(dialog.presetId);
          closeDialog();
        }
        break;
    }
  };

  const getDialogTitle = () => {
    switch (dialog.mode) {
      case 'create':
        return '保存为新方案';
      case 'rename':
        return '重命名方案';
      case 'delete':
        return '确认删除';
      default:
        return '';
    }
  };

  const getConfirmButtonText = () => {
    switch (dialog.mode) {
      case 'create':
        return '保存';
      case 'rename':
        return '确认';
      case 'delete':
        return '确认删除';
      default:
        return '确认';
    }
  };

  const isConfirmDisabled = () => {
    switch (dialog.mode) {
      case 'create':
      case 'rename':
        return !inputValue.trim();
      case 'delete':
        return false;
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#171717]">保存当前配置</span>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>保存为新方案</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#171717]">配置方案列表</span>
          {presets.length > 0 && (
            <span className="text-[11px] text-[#a3a3a3]">
              共 {presets.length} 个方案
            </span>
          )}
        </div>

        {presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-black/[0.08] rounded-lg">
            <Layers className="h-8 w-8 text-[#d4d4d4] mb-2" />
            <p className="text-sm text-[#737373]">暂无配置方案</p>
            <p className="text-[11px] text-[#a3a3a3] mt-1">
              点击上方按钮保存当前设置为方案
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {presets.map((preset) => {
              const isActive = activePresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'border-[#171717] bg-[#fafafa]'
                      : 'border-black/[0.08] bg-white hover:bg-[#fafafa]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" />
                    )}
                    {!isActive && <div className="w-2 h-2 shrink-0" />}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isActive ? 'text-[#171717]' : 'text-[#525252]'
                        }`}
                      >
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-[#a3a3a3]">
                        更新于 {formatDate(preset.updatedAt)}
                        {isActive && ' · 当前使用'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onApplyPreset(preset.id)}
                        className="p-2 text-[#525252] hover:text-[#171717] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        aria-label="应用方案"
                        title="应用此方案"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openRenameDialog(preset.id, preset.name)}
                      className="p-2 text-[#525252] hover:text-[#171717] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                      aria-label="重命名"
                      title="重命名"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteDialog(preset.id, preset.name)}
                      className="p-2 text-[#525252] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors"
                      aria-label="删除"
                      title="删除方案"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-[#a3a3a3]">
          配置方案保存在浏览器本地存储中。要在设备间同步，请使用"数据管理"标签页的导出/导入功能。
        </p>
      </div>

      {dialog.mode !== 'none' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-black/[0.08] bg-white p-5 shadow-lg"
            style={{ animation: 'scaleIn 0.2s ease-out' }}
          >
            <h3 className="text-sm font-medium text-[#171717] mb-4">
              {getDialogTitle()}
            </h3>

            {dialog.mode === 'delete' ? (
              <div className="flex items-start gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2.5 mb-4">
                <AlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#991b1b] font-medium">
                    确认删除方案 "{dialog.presetName}"？
                  </p>
                  <p className="text-[10px] text-[#b91c1c] mt-0.5">
                    此操作不可恢复
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="输入方案名称"
                  className="w-full h-10 px-3 text-sm border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleConfirm();
                    }
                    if (e.key === 'Escape') {
                      closeDialog();
                    }
                  }}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeDialog}
                className="flex-1 py-2.5 text-sm font-medium text-[#525252] bg-white border border-black/[0.08] rounded-lg hover:bg-[#fafafa] transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmDisabled()}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  dialog.mode === 'delete'
                    ? 'text-white bg-[#dc2626] hover:bg-[#b91c1c]'
                    : 'text-white bg-[#171717] hover:bg-black'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {getConfirmButtonText()}
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
      <Settings className="h-4 w-4" />
    </button>
  );
}
