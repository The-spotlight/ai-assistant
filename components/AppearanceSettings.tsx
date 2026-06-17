'use client';

import { Check } from 'lucide-react';
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
import { Button } from '@/components/ui/Button';

export default function AppearanceSettings({ onClose }: { onClose: () => void }) {
  const { appearance, updateAppearance, themeColors } = useSettings();

  return (
    <div className="w-80 max-h-[80vh] overflow-y-auto p-4">
      <h3 className="text-sm font-medium text-[#171717] mb-4">外观设置</h3>
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-[#171717]">主题色</span>
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
          <span className="text-sm font-medium text-[#171717]">消息字体大小</span>
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
          <span className="text-sm font-medium text-[#171717]">代码块高亮方案</span>
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
          <span className="text-sm font-medium text-[#171717]">消息气泡样式</span>
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
    </div>
  );
}