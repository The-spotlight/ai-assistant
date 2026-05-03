'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_OPENROUTER_MODEL_ID, OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';
import { getOrCreateDeviceId } from '@/lib/device';
import {
  THEME_PRESETS,
  CODE_HIGHLIGHT_THEMES,
  FONT_SIZES,
  BUBBLE_STYLES,
  AVATAR_SHAPES,
  AVATAR_BORDERS,
  DEFAULT_SETTINGS,
  DEFAULT_BACKGROUND_SETTINGS,
  BACKGROUND_TYPES,
  PRESET_GRADIENTS,
  PRESET_BACKGROUND_IMAGES,
  IMAGE_DISPLAY_MODES,
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
  BACKGROUND_TYPES,
  PRESET_GRADIENTS,
  PRESET_BACKGROUND_IMAGES,
  IMAGE_DISPLAY_MODES,
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

export interface AIPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

export const PRESET_PERSONAS: AIPersona[] = [
  {
    id: 'professional',
    name: '专业助手',
    description: '回答严谨专业，适合工作场景',
    icon: 'briefcase',
    systemPrompt: `你是一个专业的 AI 助手，回答风格严谨、专业、准确。

核心特点：
1. 回答结构清晰，逻辑严谨
2. 使用专业术语，表达准确
3. 提供事实性强、可信赖的信息
4. 适合工作场景、专业咨询、技术问题

回答风格：
- 使用正式但易懂的语言
- 分点说明，条理清晰
- 给出具体的建议和方案
- 遇到不确定的问题诚实说明

请用中文回答，除非用户要求其他语言。`,
  },
  {
    id: 'creative',
    name: '创意伙伴',
    description: '回答富有创意与想象力，适合头脑风暴',
    icon: 'sparkles',
    systemPrompt: `你是一个富有创意的 AI 伙伴，回答风格生动、有趣、充满想象力。

核心特点：
1. 思维发散，善于联想
2. 语言生动有趣，富有感染力
3. 提供多样化的创意方案
4. 适合头脑风暴、创意写作、灵感激发

回答风格：
- 使用生动形象的比喻和描述
- 提供多种可能性供选择
- 鼓励用户探索新想法
- 保持积极乐观的语调

请用中文回答，除非用户要求其他语言。`,
  },
  {
    id: 'coach',
    name: '学习教练',
    description: '回答循循善诱，适合学习场景',
    icon: 'book-open',
    systemPrompt: `你是一个耐心的学习教练，回答风格循循善诱、注重引导、鼓励探索。

核心特点：
1. 善于用提问引导用户思考
2. 将复杂概念分解成简单易懂的部分
3. 鼓励用户主动探索和实践
4. 适合学习新知识、技能培养、问题解答

回答风格：
- 使用苏格拉底式提问法引导思考
- 概念解释清晰，配有例子说明
- 鼓励用户"试试看"、"再想想"
- 肯定用户的努力和进步

请用中文回答，除非用户要求其他语言。`,
  },
  {
    id: 'companion',
    name: '生活管家',
    description: '回答亲切实用，适合日常生活',
    icon: 'home',
    systemPrompt: `你是一个亲切的生活管家，回答风格温暖、实用、贴心。

核心特点：
1. 语气亲切，像朋友一样交流
2. 建议实用，贴近日常生活
3. 关心用户感受，富有同理心
4. 适合日常咨询、生活建议、闲聊陪伴

回答风格：
- 使用轻松自然的口语化表达
- 给出具体可行的生活建议
- 关心用户的情绪和感受
- 偶尔可以开个小玩笑调节气氛

请用中文回答，除非用户要求其他语言。`,
  },
];

export const DEFAULT_PERSONA_ID = 'professional';

export type PersonaId = typeof PRESET_PERSONAS[number]['id'];

const PERSONA_SETTINGS_STORAGE_KEY = 'ai-assistant-persona-settings';

export function getPersonaById(id: string): AIPersona {
  return PRESET_PERSONAS.find(p => p.id === id) ?? PRESET_PERSONAS[0];
}

export function loadPersonaSettings(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_PERSONA_ID;
  }

  try {
    const stored = localStorage.getItem(PERSONA_SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PERSONA_ID;
    }

    const personaId = stored;
    const validPersonaIds = new Set(PRESET_PERSONAS.map(p => p.id));
    
    return validPersonaIds.has(personaId) ? personaId : DEFAULT_PERSONA_ID;
  } catch {
    return DEFAULT_PERSONA_ID;
  }
}

export function savePersonaSettings(personaId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSONA_SETTINGS_STORAGE_KEY, personaId);
  } catch {
    console.warn('Failed to save persona settings');
  }
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
      avatarShape: (parsed.avatarShape && parsed.avatarShape in AVATAR_SHAPES) ? parsed.avatarShape as AvatarShapeKey : DEFAULT_SETTINGS.avatarShape,
      avatarBorder: (parsed.avatarBorder && parsed.avatarBorder in AVATAR_BORDERS) ? parsed.avatarBorder as AvatarBorderKey : DEFAULT_SETTINGS.avatarBorder,
      background: validateBackgroundSettings(parsed.background),
      darkMode: typeof parsed.darkMode === 'boolean' ? parsed.darkMode : DEFAULT_SETTINGS.darkMode,
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
  personaId: string;
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  updateBackground: <K extends keyof BackgroundSettings>(key: K, value: BackgroundSettings[K]) => void;
  updateBehavior: <K extends keyof BehaviorSettings>(key: K, value: BehaviorSettings[K]) => void;
  updateModel: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
  updateKeyboardShortcuts: <K extends keyof KeyboardShortcuts>(key: K, value: KeyboardShortcuts[K]) => void;
  updatePersona: (personaId: string) => void;
  resetAppearance: () => void;
  resetBehavior: () => void;
  resetModel: () => void;
  resetKeyboardShortcuts: () => void;
  resetPersona: () => void;
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
  const [personaId, setPersonaId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return loadPersonaSettings();
    }
    return DEFAULT_PERSONA_ID;
  });

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
        if (data.personaId) {
          setPersonaId(data.personaId);
          savePersonaSettings(data.personaId);
        }
      }
    } catch (error) {
      console.error('从服务器加载设置失败:', error);
      // 加载失败时使用本地存储的设置
      setAppearance(loadSettings());
      setBehavior(loadBehaviorSettings());
      setModel(loadModelSettings());
      setKeyboardShortcuts(loadKeyboardShortcuts());
      setPersonaId(loadPersonaSettings());
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
          personaId,
        }),
      });

      if (!response.ok) {
        throw new Error('保存设置失败');
      }
    } catch (error) {
      console.error('保存设置到服务器失败:', error);
    }
  }, [appearance, behavior, model, keyboardShortcuts, personaId]);

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
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateBackground = useCallback(<K extends keyof BackgroundSettings>(
    key: K,
    value: BackgroundSettings[K]
  ) => {
    setAppearance((prev) => {
      const newBackground = { ...prev.background, [key]: value };
      const newSettings = { ...prev, background: newBackground };
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

  const updatePersona = useCallback((personaId: string) => {
    setPersonaId(personaId);
    savePersonaSettings(personaId);
  }, []);

  const resetPersona = useCallback(() => {
    setPersonaId(DEFAULT_PERSONA_ID);
    savePersonaSettings(DEFAULT_PERSONA_ID);
  }, []);

  const resetAll = useCallback(() => {
    resetAppearance();
    resetBehavior();
    resetModel();
    resetKeyboardShortcuts();
    resetPersona();
  }, [resetAppearance, resetBehavior, resetModel, resetKeyboardShortcuts, resetPersona]);

  // 深色模式使用 dark 主题，浅色模式使用选定的主题
  const effectiveTheme = appearance.darkMode ? 'dark' : appearance.theme;
  const themeColors = THEME_PRESETS[effectiveTheme];

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
    
    // 添加 data-theme 属性供 CSS 使用
    root.setAttribute('data-theme', appearance.darkMode ? 'dark' : 'light');
  }, [appearance, themeColors]);

  return (
    <SettingsContext.Provider
      value={{
        appearance,
        behavior,
        model,
        keyboardShortcuts,
        personaId,
        updateAppearance,
        updateBackground,
        updateBehavior,
        updateModel,
        updateKeyboardShortcuts,
        updatePersona,
        resetAppearance,
        resetBehavior,
        resetModel,
        resetKeyboardShortcuts,
        resetPersona,
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
