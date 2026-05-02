'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { DEFAULT_OPENROUTER_MODEL_ID, OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';
import { getOrCreateDeviceId } from '@/lib/device';
import { addActionLog } from '@/lib/action-log';
import {
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  AVATAR_SHAPES,
  AVATAR_BORDERS,
  DEFAULT_SETTINGS,
  DEFAULT_BACKGROUND_SETTINGS,
  DEFAULT_CUSTOM_BUBBLE_COLORS,
  BACKGROUND_TYPES,
  PRESET_GRADIENTS,
  PRESET_BACKGROUND_IMAGES,
  IMAGE_DISPLAY_MODES,
  BUBBLE_COLOR_PRESETS,
  MESSAGE_FONT_SIZES,
  BUBBLE_BORDER_RADIUS_MIN,
  BUBBLE_BORDER_RADIUS_MAX,
  BUBBLE_BORDER_RADIUS_DEFAULT,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type AvatarShapeKey,
  type AvatarBorderKey,
  type AppearanceSettings,
  type BackgroundSettings,
  type BackgroundTypeKey,
  type GradientPresetId,
  type ImagePresetId,
  type ImageDisplayModeKey,
  type BubbleColorPresetKey,
  type BubbleColorSettings,
  type MessageFontSizeKey,
} from '@/lib/theme-constants';

export {
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  AVATAR_SHAPES,
  AVATAR_BORDERS,
  DEFAULT_SETTINGS,
  DEFAULT_BACKGROUND_SETTINGS,
  DEFAULT_CUSTOM_BUBBLE_COLORS,
  BACKGROUND_TYPES,
  PRESET_GRADIENTS,
  PRESET_BACKGROUND_IMAGES,
  IMAGE_DISPLAY_MODES,
  BUBBLE_COLOR_PRESETS,
  MESSAGE_FONT_SIZES,
  BUBBLE_BORDER_RADIUS_MIN,
  BUBBLE_BORDER_RADIUS_MAX,
  BUBBLE_BORDER_RADIUS_DEFAULT,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type AvatarShapeKey,
  type AvatarBorderKey,
  type AppearanceSettings,
  type BackgroundSettings,
  type BackgroundTypeKey,
  type GradientPresetId,
  type ImagePresetId,
  type ImageDisplayModeKey,
  type BubbleColorPresetKey,
  type BubbleColorSettings,
  type MessageFontSizeKey,
};

export const SEND_SHORTCUT_OPTIONS = {
  enter: { name: 'Enter 发送', value: 'enter' },
  ctrlEnter: { name: 'Ctrl+Enter 发送', value: 'ctrl+enter' },
} as const;

export interface KeyboardShortcuts {
  newConversation: string;
  sendMessage: string;
  switchModel: string;
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
  newConversation: 'Ctrl+N',
  sendMessage: 'Ctrl+Enter',
  switchModel: 'Ctrl+Shift+P',
};

const KEYBOARD_SHORTCUTS_STORAGE_KEY = 'ai-assistant-keyboard-shortcuts';

export const TIMESTAMP_FORMAT_OPTIONS = {
  relative: { name: '相对时间', value: 'relative' },
  absolute: { name: '绝对时间', value: 'absolute' },
  hidden: { name: '不显示', value: 'hidden' },
} as const;

export const AUTO_ARCHIVE_DAYS_OPTIONS = {
  7: { name: '7 天', days: 7 },
  30: { name: '30 天', days: 30 },
  90: { name: '90 天', days: 90 },
} as const;

export type SendShortcutKey = keyof typeof SEND_SHORTCUT_OPTIONS;
export type TimestampFormatKey = keyof typeof TIMESTAMP_FORMAT_OPTIONS;
export type AutoArchiveDaysKey = keyof typeof AUTO_ARCHIVE_DAYS_OPTIONS;

export interface BehaviorSettings {
  sendShortcut: SendShortcutKey;
  showTokenStats: boolean;
  timestampFormat: TimestampFormatKey;
  autoArchive: boolean;
  autoArchiveDays: AutoArchiveDaysKey;
}

export interface ModelSettings {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}

export const DEFAULT_BEHAVIOR_SETTINGS: BehaviorSettings = {
  sendShortcut: 'enter',
  showTokenStats: true,
  timestampFormat: 'relative',
  autoArchive: false,
  autoArchiveDays: 30,
};

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  defaultModel: DEFAULT_OPENROUTER_MODEL_ID,
  temperature: 0.7,
  maxTokens: 4096,
  streaming: true,
};

const BEHAVIOR_SETTINGS_STORAGE_KEY = 'ai-assistant-behavior-settings';
const MODEL_SETTINGS_STORAGE_KEY = 'ai-assistant-model-settings';
const SETTINGS_PRESETS_STORAGE_KEY = 'ai-assistant-settings-presets';
const ACTIVE_PRESET_ID_STORAGE_KEY = 'ai-assistant-active-preset-id';

export interface SettingsPreset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  model: ModelSettings;
}

export function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function loadPresets(): SettingsPreset[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(SETTINGS_PRESETS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as SettingsPreset[];
    return parsed.filter(validatePreset);
  } catch {
    return [];
  }
}

export function savePresets(presets: SettingsPreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    console.warn('Failed to save presets');
  }
}

export function loadActivePresetId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(ACTIVE_PRESET_ID_STORAGE_KEY);
    return stored || null;
  } catch {
    return null;
  }
}

export function saveActivePresetId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PRESET_ID_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PRESET_ID_STORAGE_KEY);
    }
  } catch {
    console.warn('Failed to save active preset id');
  }
}

export function validatePreset(preset: unknown): preset is SettingsPreset {
  if (typeof preset !== 'object' || preset === null) {
    return false;
  }

  const p = preset as any;

  if (typeof p.id !== 'string' || !p.id) {
    return false;
  }
  if (typeof p.name !== 'string' || !p.name) {
    return false;
  }
  if (typeof p.createdAt !== 'string' || !p.createdAt) {
    return false;
  }
  if (typeof p.updatedAt !== 'string' || !p.updatedAt) {
    return false;
  }

  if (p.appearance && typeof p.appearance === 'object') {
    if (p.appearance.theme !== undefined && !(p.appearance.theme in THEME_PRESETS)) {
      return false;
    }
    if (p.appearance.fontSize !== undefined && !(p.appearance.fontSize in FONT_SIZES)) {
      return false;
    }
    if (p.appearance.codeHighlight !== undefined && !(p.appearance.codeHighlight in CODE_HIGHLIGHT_THEMES)) {
      return false;
    }
    if (p.appearance.bubbleStyle !== undefined && !(p.appearance.bubbleStyle in BUBBLE_STYLES)) {
      return false;
    }
  }

  if (p.behavior && typeof p.behavior === 'object') {
    if (p.behavior.sendShortcut !== undefined && !(p.behavior.sendShortcut in SEND_SHORTCUT_OPTIONS)) {
      return false;
    }
    if (p.behavior.timestampFormat !== undefined && !(p.behavior.timestampFormat in TIMESTAMP_FORMAT_OPTIONS)) {
      return false;
    }
  }

  return true;
}

export function buildPreset(
  name: string,
  appearance: AppearanceSettings,
  behavior: BehaviorSettings,
  model: ModelSettings
): SettingsPreset {
  const now = new Date().toISOString();
  return {
    id: generatePresetId(),
    name,
    createdAt: now,
    updatedAt: now,
    appearance: { ...appearance },
    behavior: { ...behavior },
    model: { ...model },
  };
}

export function addPreset(preset: SettingsPreset): SettingsPreset[] {
  const presets = loadPresets();
  const updated = [...presets, preset];
  savePresets(updated);
  return updated;
}

export function updatePreset(id: string, updates: Partial<SettingsPreset>): SettingsPreset[] {
  const presets = loadPresets();
  const updated = presets.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  savePresets(updated);
  return updated;
}

export function removePreset(id: string): SettingsPreset[] {
  const presets = loadPresets();
  const updated = presets.filter((p) => p.id !== id);
  savePresets(updated);

  const activeId = loadActivePresetId();
  if (activeId === id) {
    saveActivePresetId(null);
  }

  return updated;
}

export function getPresetById(id: string): SettingsPreset | undefined {
  const presets = loadPresets();
  return presets.find((p) => p.id === id);
}

export function mergePresetWithDefaults(preset: SettingsPreset): {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  model: ModelSettings;
} {
  const appearance = {
    ...DEFAULT_SETTINGS,
    ...preset.appearance,
  };
  const behavior = {
    ...DEFAULT_BEHAVIOR_SETTINGS,
    ...preset.behavior,
  };
  const model = {
    ...DEFAULT_MODEL_SETTINGS,
    ...preset.model,
  };

  return { appearance, behavior, model };
}

export function loadBehaviorSettings(): BehaviorSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_BEHAVIOR_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(BEHAVIOR_SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_BEHAVIOR_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<BehaviorSettings>;
    
    const validDays = [7, 30, 90] as const;
    
    return {
      sendShortcut: (parsed.sendShortcut && parsed.sendShortcut in SEND_SHORTCUT_OPTIONS) 
        ? parsed.sendShortcut as SendShortcutKey 
        : DEFAULT_BEHAVIOR_SETTINGS.sendShortcut,
      showTokenStats: typeof parsed.showTokenStats === 'boolean' 
        ? parsed.showTokenStats 
        : DEFAULT_BEHAVIOR_SETTINGS.showTokenStats,
      timestampFormat: (parsed.timestampFormat && parsed.timestampFormat in TIMESTAMP_FORMAT_OPTIONS) 
        ? parsed.timestampFormat as TimestampFormatKey 
        : DEFAULT_BEHAVIOR_SETTINGS.timestampFormat,
      autoArchive: typeof parsed.autoArchive === 'boolean' 
        ? parsed.autoArchive 
        : DEFAULT_BEHAVIOR_SETTINGS.autoArchive,
      autoArchiveDays: (parsed.autoArchiveDays !== undefined && validDays.includes(parsed.autoArchiveDays as any))
        ? parsed.autoArchiveDays as AutoArchiveDaysKey
        : DEFAULT_BEHAVIOR_SETTINGS.autoArchiveDays,
    };
  } catch {
    return DEFAULT_BEHAVIOR_SETTINGS;
  }
}

export function saveBehaviorSettings(settings: BehaviorSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BEHAVIOR_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save behavior settings');
  }
}

export function loadModelSettings(): ModelSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_MODEL_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(MODEL_SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_MODEL_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<ModelSettings>;
    
    const allowedModelIds = new Set(OPENROUTER_MODEL_OPTIONS.map(m => m.id));
    
    return {
      defaultModel: (parsed.defaultModel && allowedModelIds.has(parsed.defaultModel)) 
        ? parsed.defaultModel 
        : DEFAULT_MODEL_SETTINGS.defaultModel,
      temperature: (typeof parsed.temperature === 'number' && parsed.temperature >= 0 && parsed.temperature <= 2) 
        ? parsed.temperature 
        : DEFAULT_MODEL_SETTINGS.temperature,
      maxTokens: (typeof parsed.maxTokens === 'number' && parsed.maxTokens >= 1 && parsed.maxTokens <= 128000) 
        ? parsed.maxTokens 
        : DEFAULT_MODEL_SETTINGS.maxTokens,
      streaming: typeof parsed.streaming === 'boolean' 
        ? parsed.streaming 
        : DEFAULT_MODEL_SETTINGS.streaming,
    };
  } catch {
    return DEFAULT_MODEL_SETTINGS;
  }
}

export function saveModelSettings(settings: ModelSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODEL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save model settings');
  }
}

export function loadKeyboardShortcuts(): KeyboardShortcuts {
  if (typeof window === 'undefined') {
    return DEFAULT_KEYBOARD_SHORTCUTS;
  }

  try {
    const stored = localStorage.getItem(KEYBOARD_SHORTCUTS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_KEYBOARD_SHORTCUTS;
    }

    const parsed = JSON.parse(stored) as Partial<KeyboardShortcuts>;
    
    return {
      newConversation: parsed.newConversation || DEFAULT_KEYBOARD_SHORTCUTS.newConversation,
      sendMessage: parsed.sendMessage || DEFAULT_KEYBOARD_SHORTCUTS.sendMessage,
      switchModel: parsed.switchModel || DEFAULT_KEYBOARD_SHORTCUTS.switchModel,
    };
  } catch {
    return DEFAULT_KEYBOARD_SHORTCUTS;
  }
}

export function saveKeyboardShortcuts(settings: KeyboardShortcuts): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYBOARD_SHORTCUTS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save keyboard shortcuts');
  }
}

const SETTINGS_STORAGE_KEY = 'ai-assistant-appearance-settings';

function validateBackgroundSettings(background: unknown): BackgroundSettings {
  if (!background || typeof background !== 'object') {
    return DEFAULT_BACKGROUND_SETTINGS;
  }

  const bg = background as any;

  const type = (bg.type && bg.type in BACKGROUND_TYPES) ? bg.type as BackgroundTypeKey : DEFAULT_BACKGROUND_SETTINGS.type;
  
  const gradientIds = new Set(PRESET_GRADIENTS.map(g => g.id));
  const gradientId = (bg.gradientId && gradientIds.has(bg.gradientId)) ? bg.gradientId as GradientPresetId : DEFAULT_BACKGROUND_SETTINGS.gradientId;
  
  const imageIds = new Set(PRESET_BACKGROUND_IMAGES.map(i => i.id));
  const presetImageId = bg.presetImageId ? (imageIds.has(bg.presetImageId) ? bg.presetImageId as ImagePresetId : null) : null;
  
  const imageMode = (bg.imageMode && bg.imageMode in IMAGE_DISPLAY_MODES) ? bg.imageMode as ImageDisplayModeKey : DEFAULT_BACKGROUND_SETTINGS.imageMode;

  return {
    type,
    solidColor: typeof bg.solidColor === 'string' ? bg.solidColor : DEFAULT_BACKGROUND_SETTINGS.solidColor,
    gradientId,
    imageUrl: typeof bg.imageUrl === 'string' ? bg.imageUrl : DEFAULT_BACKGROUND_SETTINGS.imageUrl,
    imageMode,
    isPresetImage: typeof bg.isPresetImage === 'boolean' ? bg.isPresetImage : DEFAULT_BACKGROUND_SETTINGS.isPresetImage,
    presetImageId,
  };
}

function isValidHexColor(color: unknown): color is string {
  if (typeof color !== 'string') return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color) || /^#[0-9A-Fa-f]{3}$/.test(color);
}

function validateBubbleColorSettings(colors: unknown): BubbleColorSettings {
  if (!colors || typeof colors !== 'object') {
    return { ...DEFAULT_CUSTOM_BUBBLE_COLORS };
  }
  const c = colors as any;
  return {
    userBubble: isValidHexColor(c.userBubble) ? c.userBubble : DEFAULT_CUSTOM_BUBBLE_COLORS.userBubble,
    userText: isValidHexColor(c.userText) ? c.userText : DEFAULT_CUSTOM_BUBBLE_COLORS.userText,
    aiBubble: isValidHexColor(c.aiBubble) ? c.aiBubble : DEFAULT_CUSTOM_BUBBLE_COLORS.aiBubble,
    aiText: isValidHexColor(c.aiText) ? c.aiText : DEFAULT_CUSTOM_BUBBLE_COLORS.aiText,
  };
}

export function loadSettings(): AppearanceSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<AppearanceSettings>;
    
    const bubbleColorPreset = (parsed.bubbleColorPreset && parsed.bubbleColorPreset in BUBBLE_COLOR_PRESETS) 
      ? parsed.bubbleColorPreset as BubbleColorPresetKey 
      : (parsed.bubbleColorPreset === null ? null : DEFAULT_SETTINGS.bubbleColorPreset);
    
    const bubbleBorderRadius = (typeof parsed.bubbleBorderRadius === 'number' 
      && parsed.bubbleBorderRadius >= BUBBLE_BORDER_RADIUS_MIN 
      && parsed.bubbleBorderRadius <= BUBBLE_BORDER_RADIUS_MAX)
      ? parsed.bubbleBorderRadius
      : DEFAULT_SETTINGS.bubbleBorderRadius;
    
    const messageFontSize = (parsed.messageFontSize && parsed.messageFontSize in MESSAGE_FONT_SIZES)
      ? parsed.messageFontSize as MessageFontSizeKey
      : DEFAULT_SETTINGS.messageFontSize;
    
    return {
      theme: (parsed.theme && parsed.theme in THEME_PRESETS) ? parsed.theme as ThemeKey : DEFAULT_SETTINGS.theme,
      fontSize: (parsed.fontSize && parsed.fontSize in FONT_SIZES) ? parsed.fontSize as FontSizeKey : DEFAULT_SETTINGS.fontSize,
      codeHighlight: (parsed.codeHighlight && parsed.codeHighlight in CODE_HIGHLIGHT_THEMES) ? parsed.codeHighlight as CodeHighlightKey : DEFAULT_SETTINGS.codeHighlight,
      bubbleStyle: (parsed.bubbleStyle && parsed.bubbleStyle in BUBBLE_STYLES) ? parsed.bubbleStyle as BubbleStyleKey : DEFAULT_SETTINGS.bubbleStyle,
      avatarShape: (parsed.avatarShape && parsed.avatarShape in AVATAR_SHAPES) ? parsed.avatarShape as AvatarShapeKey : DEFAULT_SETTINGS.avatarShape,
      avatarBorder: (parsed.avatarBorder && parsed.avatarBorder in AVATAR_BORDERS) ? parsed.avatarBorder as AvatarBorderKey : DEFAULT_SETTINGS.avatarBorder,
      background: validateBackgroundSettings(parsed.background),
      darkMode: typeof parsed.darkMode === 'boolean' ? parsed.darkMode : DEFAULT_SETTINGS.darkMode,
      bubbleColorPreset,
      customBubbleColors: validateBubbleColorSettings(parsed.customBubbleColors),
      bubbleBorderRadius,
      messageFontSize,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppearanceSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save appearance settings');
  }
}

interface SettingsContextType {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  model: ModelSettings;
  keyboardShortcuts: KeyboardShortcuts;
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  updateBackground: <K extends keyof BackgroundSettings>(key: K, value: BackgroundSettings[K]) => void;
  updateBehavior: <K extends keyof BehaviorSettings>(key: K, value: BehaviorSettings[K]) => void;
  updateModel: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
  updateKeyboardShortcuts: <K extends keyof KeyboardShortcuts>(key: K, value: KeyboardShortcuts[K]) => void;
  resetAppearance: () => void;
  resetBehavior: () => void;
  resetModel: () => void;
  resetKeyboardShortcuts: () => void;
  resetAll: () => void;
  themeColors: typeof THEME_PRESETS[ThemeKey];
  settings: AppearanceSettings;
  updateSettings: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  resetSettings: () => void;
  presets: SettingsPreset[];
  activePresetId: string | null;
  createPreset: (name: string) => void;
  applyPreset: (id: string) => void;
  renamePreset: (id: string, newName: string) => void;
  deletePreset: (id: string) => void;
  refreshPresets: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    if (typeof window !== 'undefined') {
      return loadSettings();
    }
    return DEFAULT_SETTINGS;
  });
  const [behavior, setBehavior] = useState<BehaviorSettings>(() => {
    if (typeof window !== 'undefined') {
      return loadBehaviorSettings();
    }
    return DEFAULT_BEHAVIOR_SETTINGS;
  });
  const [model, setModel] = useState<ModelSettings>(() => {
    if (typeof window !== 'undefined') {
      return loadModelSettings();
    }
    return DEFAULT_MODEL_SETTINGS;
  });
  const [keyboardShortcuts, setKeyboardShortcuts] = useState<KeyboardShortcuts>(() => {
    if (typeof window !== 'undefined') {
      return loadKeyboardShortcuts();
    }
    return DEFAULT_KEYBOARD_SHORTCUTS;
  });
  const [isLoaded, setIsLoaded] = useState(typeof window !== 'undefined');
  const [presets, setPresets] = useState<SettingsPreset[]>(() => {
    if (typeof window !== 'undefined') {
      return loadPresets();
    }
    return [];
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return loadActivePresetId();
    }
    return null;
  });

  const settingsLogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSettingsLogRef = useRef<{ key: string; oldValue: any; newValue: any } | null>(null);

  const logSettingsChange = useCallback((settingKey: string, oldValue: any, newValue: any) => {
    addActionLog('modify_settings', `修改了设置：${settingKey}`, {
      setting: settingKey,
      oldValue,
      newValue,
    });
  }, []);

  const debouncedLogSettingsChange = useCallback((settingKey: string, oldValue: any, newValue: any) => {
    if (settingsLogTimerRef.current) {
      clearTimeout(settingsLogTimerRef.current);
    }
    pendingSettingsLogRef.current = { key: settingKey, oldValue, newValue };
    settingsLogTimerRef.current = setTimeout(() => {
      if (pendingSettingsLogRef.current) {
        logSettingsChange(
          pendingSettingsLogRef.current.key,
          pendingSettingsLogRef.current.oldValue,
          pendingSettingsLogRef.current.newValue
        );
        pendingSettingsLogRef.current = null;
      }
    }, 1000);
  }, [logSettingsChange]);

  // 从服务器加载设置
  const loadSettingsFromServer = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/settings', {
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.appearance) {
          setAppearance(data.appearance);
          saveSettings(data.appearance);
        }
        if (data.behavior) {
          setBehavior(data.behavior);
          saveBehaviorSettings(data.behavior);
        }
        if (data.model) {
          setModel(data.model);
          saveModelSettings(data.model);
        }
        if (data.keyboardShortcuts) {
          setKeyboardShortcuts(data.keyboardShortcuts);
          saveKeyboardShortcuts(data.keyboardShortcuts);
        }
      }
    } catch (error) {
      console.error('从服务器加载设置失败:', error);
      // 加载失败时使用本地存储的设置
      setAppearance(loadSettings());
      setBehavior(loadBehaviorSettings());
      setModel(loadModelSettings());
      setKeyboardShortcuts(loadKeyboardShortcuts());
    }
  }, []);

  // 保存设置到服务器
  const saveSettingsToServer = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          appearance,
          behavior,
          model,
          keyboardShortcuts,
        }),
      });

      if (!response.ok) {
        throw new Error('保存设置失败');
      }
    } catch (error) {
      console.error('保存设置到服务器失败:', error);
    }
  }, [appearance, behavior, model, keyboardShortcuts]);

  useEffect(() => {
    if (!isLoaded) {
      loadSettingsFromServer();
      setPresets(loadPresets());
      setActivePresetId(loadActivePresetId());
      setIsLoaded(true);
    }
  }, [isLoaded, loadSettingsFromServer]);

  // 当设置更改时，保存到服务器
  useEffect(() => {
    if (isLoaded) {
      saveSettingsToServer();
    }
  }, [appearance, behavior, model, keyboardShortcuts, isLoaded, saveSettingsToServer]);

  const refreshPresets = useCallback(() => {
    setPresets(loadPresets());
    setActivePresetId(loadActivePresetId());
  }, []);

  const createPreset = useCallback((name: string) => {
    const preset = buildPreset(name, appearance, behavior, model);
    const updated = addPreset(preset);
    setPresets(updated);
    setActivePresetId(preset.id);
    saveActivePresetId(preset.id);
  }, [appearance, behavior, model]);

  const applyPreset = useCallback((id: string) => {
    const preset = getPresetById(id);
    if (!preset) return;

    const merged = mergePresetWithDefaults(preset);

    setAppearance(merged.appearance);
    saveSettings(merged.appearance);

    setBehavior(merged.behavior);
    saveBehaviorSettings(merged.behavior);

    setModel(merged.model);
    saveModelSettings(merged.model);

    setActivePresetId(id);
    saveActivePresetId(id);
  }, []);

  const renamePreset = useCallback((id: string, newName: string) => {
    const updated = updatePreset(id, { name: newName });
    setPresets(updated);
  }, []);

  const deletePreset = useCallback((id: string) => {
    const updated = removePreset(id);
    setPresets(updated);
    setActivePresetId((prev) => (prev === id ? null : prev));
  }, []);

  const updateAppearance = useCallback(<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setAppearance((prev) => {
      const oldValue = prev[key];
      if (oldValue !== value) {
        logSettingsChange(String(key), oldValue, value);
      }
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [logSettingsChange]);

  const updateBackground = useCallback(<K extends keyof BackgroundSettings>(
    key: K,
    value: BackgroundSettings[K]
  ) => {
    setAppearance((prev) => {
      const oldValue = prev.background[key];
      if (oldValue !== value) {
        logSettingsChange(`background.${key}`, oldValue, value);
      }
      const newBackground = { ...prev.background, [key]: value };
      const newSettings = { ...prev, background: newBackground };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [logSettingsChange]);

  const updateBehavior = useCallback(<K extends keyof BehaviorSettings>(
    key: K,
    value: BehaviorSettings[K]
  ) => {
    setBehavior((prev) => {
      const oldValue = prev[key];
      if (oldValue !== value) {
        logSettingsChange(String(key), oldValue, value);
      }
      const newSettings = { ...prev, [key]: value };
      saveBehaviorSettings(newSettings);
      return newSettings;
    });
  }, [logSettingsChange]);

  const updateModel = useCallback(<K extends keyof ModelSettings>(
    key: K,
    value: ModelSettings[K]
  ) => {
    setModel((prev) => {
      const oldValue = prev[key];
      if (oldValue !== value) {
        if (key === 'temperature' || key === 'maxTokens') {
          debouncedLogSettingsChange(String(key), oldValue, value);
        } else {
          logSettingsChange(String(key), oldValue, value);
        }
      }
      const newSettings = { ...prev, [key]: value };
      saveModelSettings(newSettings);
      return newSettings;
    });
  }, [logSettingsChange, debouncedLogSettingsChange]);

  const updateKeyboardShortcuts = useCallback(<K extends keyof KeyboardShortcuts>(
    key: K,
    value: KeyboardShortcuts[K]
  ) => {
    setKeyboardShortcuts((prev) => {
      const oldValue = prev[key];
      if (oldValue !== value) {
        logSettingsChange(`keyboard.${key}`, oldValue, value);
      }
      const newSettings = { ...prev, [key]: value };
      saveKeyboardShortcuts(newSettings);
      return newSettings;
    });
  }, [logSettingsChange]);

  const resetAppearance = useCallback(() => {
    setAppearance(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  const resetBehavior = useCallback(() => {
    setBehavior(DEFAULT_BEHAVIOR_SETTINGS);
    saveBehaviorSettings(DEFAULT_BEHAVIOR_SETTINGS);
  }, []);

  const resetModel = useCallback(() => {
    setModel(DEFAULT_MODEL_SETTINGS);
    saveModelSettings(DEFAULT_MODEL_SETTINGS);
  }, []);

  const resetKeyboardShortcuts = useCallback(() => {
    setKeyboardShortcuts(DEFAULT_KEYBOARD_SHORTCUTS);
    saveKeyboardShortcuts(DEFAULT_KEYBOARD_SHORTCUTS);
  }, []);

  const resetAll = useCallback(() => {
    resetAppearance();
    resetBehavior();
    resetModel();
    resetKeyboardShortcuts();
  }, [resetAppearance, resetBehavior, resetModel, resetKeyboardShortcuts]);

  // 深色模式使用 dark 主题，浅色模式使用选定的主题
  const effectiveTheme = appearance.darkMode ? 'dark' : appearance.theme;
  const themeColors = THEME_PRESETS[effectiveTheme];

  // 获取实际的气泡颜色（预设或自定义）
  const getEffectiveBubbleColors = useCallback(() => {
    if (appearance.bubbleColorPreset && appearance.bubbleColorPreset in BUBBLE_COLOR_PRESETS) {
      return BUBBLE_COLOR_PRESETS[appearance.bubbleColorPreset];
    }
    return appearance.customBubbleColors;
  }, [appearance.bubbleColorPreset, appearance.customBubbleColors]);

  const effectiveBubbleColors = getEffectiveBubbleColors();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    root.style.setProperty('--theme-primary', themeColors.primary);
    root.style.setProperty('--theme-secondary', themeColors.secondary);
    root.style.setProperty('--theme-accent', themeColors.accent);
    root.style.setProperty('--theme-bg-primary', themeColors.bgPrimary);
    root.style.setProperty('--theme-bg-secondary', themeColors.bgSecondary);
    root.style.setProperty('--theme-bg-tertiary', themeColors.bgTertiary);
    root.style.setProperty('--theme-border', themeColors.border);
    root.style.setProperty('--theme-text-primary', themeColors.textPrimary);
    root.style.setProperty('--theme-text-secondary', themeColors.textSecondary);
    root.style.setProperty('--theme-text-muted', themeColors.textMuted);
    
    // 使用消息样式设置中的气泡颜色（优先级高于主题预设）
    const bubbleColors = getEffectiveBubbleColors();
    root.style.setProperty('--theme-user-bubble', bubbleColors.userBubble);
    root.style.setProperty('--theme-user-text', bubbleColors.userText);
    root.style.setProperty('--theme-ai-bubble', bubbleColors.aiBubble);
    root.style.setProperty('--theme-ai-text', bubbleColors.aiText);
    
    // 气泡圆角
    root.style.setProperty('--bubble-border-radius', `${appearance.bubbleBorderRadius}px`);
    
    // 消息字体大小
    const messageFontSizeConfig = MESSAGE_FONT_SIZES[appearance.messageFontSize];
    root.style.setProperty('--message-font-size', messageFontSizeConfig.value);
    root.style.setProperty('--message-line-height', messageFontSizeConfig.lineHeight);
    
    // 全局字体大小（保持兼容）
    const fontSizeConfig = FONT_SIZES[appearance.fontSize];
    root.style.setProperty('--theme-font-size', fontSizeConfig.value);
    root.style.setProperty('--theme-line-height', fontSizeConfig.lineHeight);
    
    // 添加 data-theme 属性供 CSS 使用
    root.setAttribute('data-theme', appearance.darkMode ? 'dark' : 'light');
  }, [appearance, themeColors, getEffectiveBubbleColors]);

  return (
    <SettingsContext.Provider
      value={{
        appearance,
        behavior,
        model,
        keyboardShortcuts,
        updateAppearance,
        updateBackground,
        updateBehavior,
        updateModel,
        updateKeyboardShortcuts,
        resetAppearance,
        resetBehavior,
        resetModel,
        resetKeyboardShortcuts,
        resetAll,
        themeColors,
        settings: appearance,
        updateSettings: updateAppearance,
        resetSettings: resetAppearance,
        presets,
        activePresetId,
        createPreset,
        applyPreset,
        renamePreset,
        deletePreset,
        refreshPresets,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export interface CustomCommand {
  id: string;
  name: string;
  command: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface UserProfile {
  nickname: string;
  avatar: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  nickname: '我的',
  avatar: '',
};

export const PRESET_AVATARS = {
  avatar1: { name: '头像1', emoji: '👤' },
  avatar2: { name: '头像2', emoji: '👩' },
  avatar3: { name: '头像3', emoji: '👨' },
  avatar4: { name: '头像4', emoji: '🧑' },
  avatar5: { name: '头像5', emoji: '👩‍💼' },
  avatar6: { name: '头像6', emoji: '👨‍💼' },
} as const;

export const COMMAND_ICONS = {
  wand2: { name: '魔法棒', emoji: '🪄' },
  pencil: { name: '铅笔', emoji: '✏️' },
  sparkles: { name: '闪光', emoji: '✨' },
  rocket: { name: '火箭', emoji: '🚀' },
  lightbulb: { name: '灯泡', emoji: '💡' },
  brain: { name: '大脑', emoji: '🧠' },
  book: { name: '书本', emoji: '📚' },
  messageSquare: { name: '对话', emoji: '💬' },
  clipboard: { name: '剪贴板', emoji: '📋' },
  star: { name: '星星', emoji: '⭐' },
  heart: { name: '爱心', emoji: '❤️' },
  thumbsUp: { name: '点赞', emoji: '👍' },
  refreshCw: { name: '刷新', emoji: '🔄' },
  settings: { name: '设置', emoji: '⚙️' },
  zap: { name: '闪电', emoji: '⚡' },
  target: { name: '目标', emoji: '🎯' },
} as const;

export type CommandIconKey = keyof typeof COMMAND_ICONS;

export type PresetAvatarKey = keyof typeof PRESET_AVATARS;

const USER_PROFILE_STORAGE_KEY = 'ai-assistant-user-profile';

const CUSTOM_COMMANDS_STORAGE_KEY = 'ai-assistant-custom-commands';

export function loadCustomCommands(): CustomCommand[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(CUSTOM_COMMANDS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CustomCommand[];
    return parsed.filter(validateCustomCommand);
  } catch {
    return [];
  }
}

export function saveCustomCommands(commands: CustomCommand[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_COMMANDS_STORAGE_KEY, JSON.stringify(commands));
  } catch {
    console.warn('Failed to save custom commands');
  }
}

export function validateCustomCommand(command: unknown): command is CustomCommand {
  if (typeof command !== 'object' || command === null) {
    return false;
  }

  const c = command as any;

  if (typeof c.id !== 'string' || !c.id) return false;
  if (typeof c.name !== 'string' || !c.name.trim()) return false;
  if (typeof c.command !== 'string' || !c.command.trim()) return false;
  if (typeof c.description !== 'string') return false;
  if (typeof c.prompt !== 'string' || !c.prompt.trim()) return false;
  if (typeof c.icon !== 'string') return false;

  return true;
}

export function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function addCustomCommand(command: Omit<CustomCommand, 'id'>): CustomCommand[] {
  const commands = loadCustomCommands();
  const newCommand: CustomCommand = {
    ...command,
    id: generateCommandId(),
  };
  const updated = [...commands, newCommand];
  saveCustomCommands(updated);
  return updated;
}

export function updateCustomCommand(id: string, updates: Partial<CustomCommand>): CustomCommand[] {
  const commands = loadCustomCommands();
  const updated = commands.map((c) => {
    if (c.id === id) {
      return { ...c, ...updates };
    }
    return c;
  });
  saveCustomCommands(updated);
  return updated;
}

export function removeCustomCommand(id: string): CustomCommand[] {
  const commands = loadCustomCommands();
  const updated = commands.filter((c) => c.id !== id);
  saveCustomCommands(updated);
  return updated;
}

export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_PROFILE;
  }

  try {
    const stored = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_USER_PROFILE;
    }

    const parsed = JSON.parse(stored) as Partial<UserProfile>;
    
    return {
      nickname: typeof parsed.nickname === 'string' && parsed.nickname.trim() ? parsed.nickname : DEFAULT_USER_PROFILE.nickname,
      avatar: typeof parsed.avatar === 'string' ? parsed.avatar : DEFAULT_USER_PROFILE.avatar,
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    console.warn('Failed to save user profile');
  }
}

export interface CustomModel {
  id: string;
  name: string;
  encryptedApiKey: string;
  baseUrl: string;
  modelId: string;
  contextWindow: number;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

const CUSTOM_MODELS_STORAGE_KEY = 'ai-assistant-custom-models';

const API_KEY_OBFUSCATION_KEY = 'ai-assistant-obfuscation-key-2024';

function obfuscateApiKey(apiKey: string): string {
  if (typeof window === 'undefined') return apiKey;
  try {
    const keyBytes = new TextEncoder().encode(API_KEY_OBFUSCATION_KEY);
    const dataBytes = new TextEncoder().encode(apiKey);
    const result = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      result[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return btoa(String.fromCharCode(...result));
  } catch {
    return btoa(apiKey);
  }
}

function deobfuscateApiKey(encrypted: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const keyBytes = new TextEncoder().encode(API_KEY_OBFUSCATION_KEY);
    const decoded = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const result = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      result[i] = decoded[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    try {
      return atob(encrypted);
    } catch {
      return '';
    }
  }
}

export function encryptApiKey(apiKey: string): string {
  return obfuscateApiKey(apiKey);
}

export function decryptApiKey(encrypted: string): string {
  return deobfuscateApiKey(encrypted);
}

export function generateCustomModelId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function loadCustomModels(): CustomModel[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CustomModel[];
    return parsed.filter(validateCustomModel);
  } catch {
    return [];
  }
}

export function saveCustomModels(models: CustomModel[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch {
    console.warn('Failed to save custom models');
  }
}

export function validateCustomModel(model: unknown): model is CustomModel {
  if (typeof model !== 'object' || model === null) {
    return false;
  }

  const m = model as any;

  if (typeof m.id !== 'string' || !m.id) return false;
  if (typeof m.name !== 'string' || !m.name.trim()) return false;
  if (typeof m.encryptedApiKey !== 'string') return false;
  if (typeof m.baseUrl !== 'string' || !m.baseUrl.trim()) return false;
  if (typeof m.modelId !== 'string' || !m.modelId.trim()) return false;
  if (typeof m.contextWindow !== 'number' || m.contextWindow < 1) return false;
  if (typeof m.provider !== 'string') return false;

  return true;
}

export function addCustomModel(model: Omit<CustomModel, 'id' | 'createdAt' | 'updatedAt' | 'encryptedApiKey'> & { apiKey: string }): CustomModel[] {
  const models = loadCustomModels();
  const now = new Date().toISOString();
  const newModel: CustomModel = {
    id: generateCustomModelId(),
    name: model.name,
    encryptedApiKey: encryptApiKey(model.apiKey),
    baseUrl: model.baseUrl,
    modelId: model.modelId,
    contextWindow: model.contextWindow,
    provider: model.provider,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [...models, newModel];
  saveCustomModels(updated);
  return updated;
}

export function updateCustomModel(id: string, updates: Partial<Omit<CustomModel, 'id' | 'createdAt'>> & { apiKey?: string }): CustomModel[] {
  const models = loadCustomModels();
  const updated = models.map((m) => {
    if (m.id === id) {
      const { apiKey, ...otherUpdates } = updates;
      const now = new Date().toISOString();
      return {
        ...m,
        ...otherUpdates,
        ...(apiKey ? { encryptedApiKey: encryptApiKey(apiKey) } : {}),
        updatedAt: now,
      };
    }
    return m;
  });
  saveCustomModels(updated);
  return updated;
}

export function removeCustomModel(id: string): CustomModel[] {
  const models = loadCustomModels();
  const updated = models.filter((m) => m.id !== id);
  saveCustomModels(updated);
  return updated;
}

export function getCustomModelById(id: string): CustomModel | undefined {
  const models = loadCustomModels();
  return models.find((m) => m.id === id);
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
