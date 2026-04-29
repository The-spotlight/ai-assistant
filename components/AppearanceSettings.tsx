'use client';

import { useRef, useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import {
  useSettings,
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  BACKGROUND_TYPES,
  PRESET_GRADIENTS,
  PRESET_BACKGROUND_IMAGES,
  IMAGE_DISPLAY_MODES,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type BackgroundTypeKey,
  type GradientPresetId,
  type ImagePresetId,
  type ImageDisplayModeKey,
} from '@/lib/settings';
import { Button } from '@/components/ui/Button';

export default function AppearanceSettings({ onClose }: { onClose: () => void }) {
  const { appearance, updateAppearance, updateBackground, themeColors } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateBackground('imageUrl', dataUrl);
        updateBackground('isPresetImage', false);
        updateBackground('presetImageId', null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCustomImage = () => {
    updateBackground('imageUrl', '');
    updateBackground('isPresetImage', false);
    updateBackground('presetImageId', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectPresetImage = (imageId: ImagePresetId) => {
    const presetImage = PRESET_BACKGROUND_IMAGES.find(img => img.id === imageId);
    if (presetImage) {
      updateBackground('imageUrl', presetImage.url);
      updateBackground('isPresetImage', true);
      updateBackground('presetImageId', imageId);
    }
  };

  const getBackgroundPreviewStyle = (): React.CSSProperties => {
    const bg = appearance.background;
    switch (bg.type) {
      case 'solid':
        return { backgroundColor: bg.solidColor };
      case 'gradient':
        const gradient = PRESET_GRADIENTS.find(g => g.id === bg.gradientId);
        return { background: gradient?.value || '#ffffff' };
      case 'image':
        if (bg.imageUrl) {
          const modeConfig = IMAGE_DISPLAY_MODES[bg.imageMode];
          return {
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: modeConfig.size,
            backgroundPosition: modeConfig.position,
            backgroundRepeat: modeConfig.repeat,
          };
        }
        return { backgroundColor: '#f5f5f5' };
      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  return (
    <div className="w-80 max-h-[80vh] overflow-y-auto p-4">
      <h3 className="text-sm font-medium text-[#171717] mb-4">外观设置</h3>
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-[#171717]">聊天背景</span>
          
          <div className="flex gap-2 mb-4">
            {(Object.entries(BACKGROUND_TYPES) as [BackgroundTypeKey, string][]).map(([key, value]) => {
              const isSelected = appearance.background.type === key;
              const labels: Record<BackgroundTypeKey, string> = {
                solid: '纯色',
                gradient: '渐变',
                image: '图片',
              };
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateBackground('type', key)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>

          <div
            className="w-full h-24 rounded-xl border border-black/[0.08] shadow-inner mb-4"
            style={getBackgroundPreviewStyle()}
          />

          {appearance.background.type === 'solid' && (
            <div className="flex flex-col gap-3">
              <label className="text-xs text-[#525252]">选择背景颜色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={appearance.background.solidColor}
                  onChange={(e) => updateBackground('solidColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-black/[0.08] p-0"
                />
                <span className="text-sm font-mono text-[#525252]">
                  {appearance.background.solidColor}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {['#ffffff', '#fafafa', '#f5f5f5', '#fef3c7', '#e0f2fe', '#fce7f3'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateBackground('solidColor', color)}
                    className={`w-8 h-8 rounded-full border border-black/[0.08] transition-all ${
                      appearance.background.solidColor === color
                        ? 'ring-2 ring-[#171717] ring-offset-2'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {appearance.background.type === 'gradient' && (
            <div className="grid grid-cols-2 gap-2">
              {PRESET_GRADIENTS.map((gradient) => {
                const isSelected = appearance.background.gradientId === gradient.id;
                return (
                  <button
                    key={gradient.id}
                    type="button"
                    onClick={() => updateBackground('gradientId', gradient.id as GradientPresetId)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#171717] bg-[#fafafa]'
                        : 'hover:bg-[#fafafa]'
                    }`}
                    title={gradient.name}
                  >
                    <div
                      className="w-full h-12 rounded-lg border border-black/[0.08] shadow-sm"
                      style={{ background: gradient.value }}
                    />
                    <span className="text-[10px] text-[#525252]">{gradient.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {appearance.background.type === 'image' && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors"
                >
                  <Upload className="h-4 w-4 text-[#525252]" />
                  <span className="text-sm text-[#525252]">上传图片</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {appearance.background.imageUrl && (
                  <button
                    type="button"
                    onClick={clearCustomImage}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors"
                    title="清除图片"
                  >
                    <X className="h-4 w-4 text-[#525252]" />
                  </button>
                )}
              </div>

              {appearance.background.imageUrl && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-[#525252]">显示方式</span>
                  <div className="flex gap-2">
                    {(Object.entries(IMAGE_DISPLAY_MODES) as [ImageDisplayModeKey, typeof IMAGE_DISPLAY_MODES[ImageDisplayModeKey]][]).map(
                      ([key, mode]) => {
                        const isSelected = appearance.background.imageMode === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateBackground('imageMode', key)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-[#171717] text-white'
                                : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5]'
                            }`}
                          >
                            {mode.name}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#525252]">预设背景</span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKGROUND_IMAGES.map((image) => {
                    const isSelected = appearance.background.presetImageId === image.id;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => selectPresetImage(image.id as ImagePresetId)}
                        className={`aspect-square rounded-lg border border-black/[0.08] overflow-hidden transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#171717] ring-offset-1'
                            : 'hover:scale-105'
                        }`}
                        title={image.name}
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

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