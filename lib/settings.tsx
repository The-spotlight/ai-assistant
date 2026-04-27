'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_OPENROUTER_MODEL_ID, OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';
import {
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  DEFAULT_SETTINGS,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type AppearanceSettings,
} from '@/lib/theme-constants';

export {
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  DEFAULT_SETTINGS,
  type ThemeKey,
  type CodeHighlightKey,
  type FontSizeKey,
  type BubbleStyleKey,
  type AppearanceSettings,
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
  keyboardShortcuts: KeyboardShortcuts;
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
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

  useEffect(() => {
    if (!isLoaded) {
      setAppearance(loadSettings());
      setBehavior(loadBehaviorSettings());
      setModel(loadModelSettings());
      setKeyboardShortcuts(loadKeyboardShortcuts());
      setPresets(loadPresets());
      setActivePresetId(loadActivePresetId());
      setIsLoaded(true);
    }
  }, [isLoaded]);

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

  const updateKeyboardShortcuts = useCallback(<K extends keyof KeyboardShortcuts>(
    key: K,
    value: KeyboardShortcuts[K]
  ) => {
    setKeyboardShortcuts((prev) => {
      const newSettings = { ...prev, [key]: value };
      saveKeyboardShortcuts(newSettings);
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

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
