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

export const AVATAR_SHAPES = {
  circle: { name: '圆形', borderRadius: 'rounded-full' },
  square: { name: '方形', borderRadius: 'rounded-lg' },
} as const;

export const AVATAR_BORDERS = {
  bordered: { name: '带边框', border: 'border-2 border-[#e5e5e5]' },
  none: { name: '无边框', border: '' },
} as const;

export type ThemeKey = keyof typeof THEME_PRESETS;
export type CodeHighlightKey = keyof typeof CODE_HIGHLIGHT_THEMES;
export type FontSizeKey = keyof typeof FONT_SIZES;
export type BubbleStyleKey = keyof typeof BUBBLE_STYLES;
export type AvatarShapeKey = keyof typeof AVATAR_SHAPES;
export type AvatarBorderKey = keyof typeof AVATAR_BORDERS;

export interface AppearanceSettings {
  theme: ThemeKey;
  fontSize: FontSizeKey;
  codeHighlight: CodeHighlightKey;
  bubbleStyle: BubbleStyleKey;
  avatarShape: AvatarShapeKey;
  avatarBorder: AvatarBorderKey;
}

export const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: 'default',
  fontSize: 'medium',
  codeHighlight: 'oneDark',
  bubbleStyle: 'relaxed',
  avatarShape: 'circle',
  avatarBorder: 'none',
};
