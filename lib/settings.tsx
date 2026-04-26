'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_OPENROUTER_MODEL_ID, OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';

export const SEND_SHORTCUT_OPTIONS = {
  enter: { name: 'Enter 发送', value: 'enter' },
  ctrlEnter: { name: 'Ctrl+Enter 发送', value: 'ctrl+enter' },
} as const;

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

export const THEME_PRESETS = {
  default: {
    name: '默认',
    primary: '#171717',
    secondary: '#4d4d4d',
    accent: '#0072f5',
    bgPrimary: '#ffffff',
    bgSecondary: '#f6f6f7',
    bgTertiary: '#fafafa',
    border: 'rgba(0,0,0,0.08)',
    textPrimary: '#171717',
    textSecondary: '#4d4d4d',
    textMuted: '#a3a3a3',
    userBubble: '#171717',
    userText: '#ffffff',
    aiBubble: '#ffffff',
    aiText: '#171717',
  },
  ocean: {
    name: '海洋蓝',
    primary: '#0284c7',
    secondary: '#0369a1',
    accent: '#0ea5e9',
    bgPrimary: '#ffffff',
    bgSecondary: '#f0f9ff',
    bgTertiary: '#e0f2fe',
    border: 'rgba(2,132,199,0.15)',
    textPrimary: '#0c4a6e',
    textSecondary: '#0369a1',
    textMuted: '#7dd3fc',
    userBubble: '#0284c7',
    userText: '#ffffff',
    aiBubble: '#e0f2fe',
    aiText: '#0c4a6e',
  },
  forest: {
    name: '森林绿',
    primary: '#15803d',
    secondary: '#166534',
    accent: '#22c55e',
    bgPrimary: '#ffffff',
    bgSecondary: '#f0fdf4',
    bgTertiary: '#dcfce7',
    border: 'rgba(21,128,61,0.15)',
    textPrimary: '#14532d',
    textSecondary: '#15803d',
    textMuted: '#86efac',
    userBubble: '#15803d',
    userText: '#ffffff',
    aiBubble: '#dcfce7',
    aiText: '#14532d',
  },
  sunset: {
    name: '日落橙',
    primary: '#c2410c',
    secondary: '#9a3412',
    accent: '#f97316',
    bgPrimary: '#ffffff',
    bgSecondary: '#fff7ed',
    bgTertiary: '#ffedd5',
    border: 'rgba(194,65,12,0.15)',
    textPrimary: '#7c2d12',
    textSecondary: '#c2410c',
    textMuted: '#fdba74',
    userBubble: '#c2410c',
    userText: '#ffffff',
    aiBubble: '#ffedd5',
    aiText: '#7c2d12',
  },
  dark: {
    name: '深色',
    primary: '#fafafa',
    secondary: '#d4d4d4',
    accent: '#60a5fa',
    bgPrimary: '#171717',
    bgSecondary: '#262626',
    bgTertiary: '#1f1f1f',
    border: 'rgba(255,255,255,0.1)',
    textPrimary: '#fafafa',
    textSecondary: '#d4d4d4',
    textMuted: '#737373',
    userBubble: '#3b82f6',
    userText: '#ffffff',
    aiBubble: '#262626',
    aiText: '#fafafa',
  },
} as const;

export const CODE_HIGHLIGHT_THEMES = {
  oneDark: { name: 'One Dark', value: 'oneDark' },
  vs: { name: 'VS Code', value: 'vs' },
  dracula: { name: 'Dracula', value: 'dracula' },
  prism: { name: 'Prism', value: 'prism' },
  solarizedlight: { name: 'Solarized Light', value: 'solarizedlight' },
  tomorrow: { name: 'Tomorrow', value: 'tomorrow' },
} as const;

export const FONT_SIZES = {
  small: { name: '小', value: '13px', lineHeight: '1.5' },
  medium: { name: '中', value: '14px', lineHeight: '1.6' },
  large: { name: '大', value: '15px', lineHeight: '1.7' },
  xlarge: { name: '特大', value: '16px', lineHeight: '1.8' },
} as const;

export const BUBBLE_STYLES = {
  compact: {
    name: '紧凑',
    padding: 'px-3 py-2',
    borderRadius: 'rounded-lg',
    spacing: 'mb-2',
  },
  relaxed: {
    name: '宽松',
    padding: 'px-4 py-3',
    borderRadius: 'rounded-xl',
    spacing: 'mb-4',
  },
} as const;

export type ThemeKey = keyof typeof THEME_PRESETS;
export type CodeHighlightKey = keyof typeof CODE_HIGHLIGHT_THEMES;
export type FontSizeKey = keyof typeof FONT_SIZES;
export type BubbleStyleKey = keyof typeof BUBBLE_STYLES;

export interface AppearanceSettings {
  theme: ThemeKey;
  fontSize: FontSizeKey;
  codeHighlight: CodeHighlightKey;
  bubbleStyle: BubbleStyleKey;
}

export const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: 'default',
  fontSize: 'medium',
  codeHighlight: 'oneDark',
  bubbleStyle: 'relaxed',
};

const SETTINGS_STORAGE_KEY = 'ai-assistant-appearance-settings';

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
    
    return {
      theme: (parsed.theme && parsed.theme in THEME_PRESETS) ? parsed.theme as ThemeKey : DEFAULT_SETTINGS.theme,
      fontSize: (parsed.fontSize && parsed.fontSize in FONT_SIZES) ? parsed.fontSize as FontSizeKey : DEFAULT_SETTINGS.fontSize,
      codeHighlight: (parsed.codeHighlight && parsed.codeHighlight in CODE_HIGHLIGHT_THEMES) ? parsed.codeHighlight as CodeHighlightKey : DEFAULT_SETTINGS.codeHighlight,
      bubbleStyle: (parsed.bubbleStyle && parsed.bubbleStyle in BUBBLE_STYLES) ? parsed.bubbleStyle as BubbleStyleKey : DEFAULT_SETTINGS.bubbleStyle,
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
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  updateBehavior: <K extends keyof BehaviorSettings>(key: K, value: BehaviorSettings[K]) => void;
  updateModel: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
  resetAppearance: () => void;
  resetBehavior: () => void;
  resetModel: () => void;
  resetAll: () => void;
  themeColors: typeof THEME_PRESETS[ThemeKey];
  settings: AppearanceSettings;
  updateSettings: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  resetSettings: () => void;
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
  const [isLoaded, setIsLoaded] = useState(typeof window !== 'undefined');

  useEffect(() => {
    if (!isLoaded) {
      setAppearance(loadSettings());
      setBehavior(loadBehaviorSettings());
      setModel(loadModelSettings());
      setIsLoaded(true);
    }
  }, [isLoaded]);

  const updateAppearance = useCallback(<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setAppearance((prev) => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateBehavior = useCallback(<K extends keyof BehaviorSettings>(
    key: K,
    value: BehaviorSettings[K]
  ) => {
    setBehavior((prev) => {
      const newSettings = { ...prev, [key]: value };
      saveBehaviorSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateModel = useCallback(<K extends keyof ModelSettings>(
    key: K,
    value: ModelSettings[K]
  ) => {
    setModel((prev) => {
      const newSettings = { ...prev, [key]: value };
      saveModelSettings(newSettings);
      return newSettings;
    });
  }, []);

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

  const resetAll = useCallback(() => {
    resetAppearance();
    resetBehavior();
    resetModel();
  }, [resetAppearance, resetBehavior, resetModel]);

  const themeColors = THEME_PRESETS[appearance.theme];

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
    root.style.setProperty('--theme-user-bubble', themeColors.userBubble);
    root.style.setProperty('--theme-user-text', themeColors.userText);
    root.style.setProperty('--theme-ai-bubble', themeColors.aiBubble);
    root.style.setProperty('--theme-ai-text', themeColors.aiText);
    
    const fontSizeConfig = FONT_SIZES[appearance.fontSize];
    root.style.setProperty('--theme-font-size', fontSizeConfig.value);
    root.style.setProperty('--theme-line-height', fontSizeConfig.lineHeight);
  }, [appearance, themeColors]);

  return (
    <SettingsContext.Provider
      value={{
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
        settings: appearance,
        updateSettings: updateAppearance,
        resetSettings: resetAppearance,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
