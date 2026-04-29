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

export const BACKGROUND_TYPES = {
  solid: 'solid',
  gradient: 'gradient',
  image: 'image',
} as const;

export type BackgroundTypeKey = keyof typeof BACKGROUND_TYPES;

export const PRESET_GRADIENTS = [
  {
    id: 'blue-white',
    name: '浅蓝到白色',
    value: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)',
  },
  {
    id: 'purple-pink',
    name: '浅紫到浅粉',
    value: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
  },
  {
    id: 'green-blue',
    name: '浅绿到浅蓝',
    value: 'linear-gradient(135deg, #dcfce7 0%, #e0f2fe 100%)',
  },
  {
    id: 'orange-yellow',
    name: '浅橙到浅黄',
    value: 'linear-gradient(135deg, #ffedd5 0%, #fef9c3 100%)',
  },
  {
    id: 'dark-gradient',
    name: '深色渐变',
    value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  {
    id: 'sunset',
    name: '日落渐变',
    value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: 'cool-blue',
    name: '清凉蓝',
    value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  {
    id: 'deep-purple',
    name: '深邃紫',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'warm-gray',
    name: '温暖灰',
    value: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  {
    id: 'forest',
    name: '森林绿',
    value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  },
] as const;

export type GradientPresetId = typeof PRESET_GRADIENTS[number]['id'];

export const PRESET_BACKGROUND_IMAGES = [
  {
    id: 'geometric-blur',
    name: '模糊几何图形',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9ImJsdXIiPgogICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyMCIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZmFmYWZhIi8+CiAgPGNpcmNsZSBjeD0iMTUwIiBjeT0iMTUwIiByPSIxNTAiIGZpbGw9IiNmZTM3ZTgiIGZpbHRlcj0idXJsKCNibHVyKSIgb3BhY2l0eT0iMC41Ii8+CiAgPGNpcmNsZSBjeD0iNDUwIiBjeT0iMjUwIiByPSIxODAiIGZpbGw9IiNkY2ZjZTciIGZpbHRlcj0idXJsKCNibHVyKSIgb3BhY2l0eT0iMC42Ii8+CiAgPGNpcmNsZSBjeD0iMzAwIiBjeT0iNDUwIiByPSIxNjAiIGZpbGw9IiNjN2VkZmYiIGZpbHRlcj0idXJsKCNibHVyKSIgb3BhY2l0eT0iMC41Ii8+CiAgPHJlY3QgeD0iMTAwIiB5PSIzMDAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZmVlNmMwIiBmaWx0ZXI9InVybCgjYmx1cikiIG9wYWNpdHk9IjAuNCIgdHJhbnNmb3JtPSJyb3RhdGUoNDUgMjAwIDQwMCkiLz4KPC9zdmc+',
  },
  {
    id: 'soft-texture',
    name: '淡雅纹理',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZTVlN2ViIiBvcGFjaXR5PSIwLjUiLz4KICAgIDwvcGF0dGVybj4KICAgIDxmaWx0ZXIgaWQ9ImJsdXIiPgogICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzMCIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjcGF0dGVybikiLz4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MDAiIHI9IjIwMCIgZmlsbD0iI2YwZjlmZiIgZmlsdGVyPSJ1cmwoI2JsdXIpIiBvcGFjaXR5PSIwLjQiLz4KICA8Y2lyY2xlIGN4PSI1MDAiIGN5PSIxMDAiIHI9IjI1MCIgZmlsbD0iI2ZlZjRmNyIgZmlsdGVyPSJ1cmwoI2JsdXIpIiBvcGFjaXR5PSIwLjQiLz4KPC9zdmc+',
  },
  {
    id: 'wave-pattern',
    name: '波浪图案',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjVmNWY1O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlY2VlZjA7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGZpbHRlciBpZD0iYmx1ciI+CiAgICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjEwIi8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JhZCkiLz4KICA8cGF0aCBkPSJNMCwzMDAgUTE1MCwyNTAgMzAwLDMwMCBUNDUwLDM1MCA2MDAsMzAwIEw2MDAsNjAwIEwwLDYwMCBaIiBmaWxsPSIjZTBlMGY2IiBvcGFjaXR5PSIwLjUiIGZpbHRlcj0idXJsKCNibHVyKSIvPgogIDxwYXRoIGQ9Ik0wLDM1MCBRMTUwLDQwMCAzMDAsMzUwIFQ2MDAsMzUwIEw2MDAsNjAwIEwwLDYwMCBaIiBmaWxsPSIjZjBmNWZmIiBvcGFjaXR5PSIwLjQiIGZpbHRlcj0idXJsKCNibHVyKSIvPgogIDxwYXRoIGQ9Ik0wLDQwMCBRMTUwLDM1MCAzMDAsNDAwIFQ2MDAsNDAwIEw2MDAsNjAwIEwwLDYwMCBaIiBmaWxsPSIjZmVmNGY4IiBvcGFjaXR5PSIwLjMiIGZpbHRlcj0idXJsKCNibHVyKSIvPgo8L3N2Zz4=',
  },
  {
    id: 'cloud-like',
    name: '云朵质感',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9ImJsdXItbGVzcyI+CiAgICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQwIi8+CiAgICA8L2ZpbHRlcj4KICAgIDxmaWx0ZXIgaWQ9ImJsdXItbWVkaXVtIj4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMjUiLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y4ZjhmYyIvPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjIwMCIgcj0iMTIwIiBmaWxsPSIjZmZmZmZmIiBmaWx0ZXI9InVybCgjYmx1ci1sZXNzKSIgb3BhY2l0eT0iMC43Ii8+CiAgPGNpcmNsZSBjeD0iMjUwIiBjeT0iMTUwIiByPSIxNTAiIGZpbGw9IiNmZmZmZmYiIGZpbHRlcj0idXJsKCNibHVyLWxlc3MpIiBvcGFjaXR5PSIwLjgiLz4KICA8Y2lyY2xlIGN4PSI0MDAiIGN5PSIyMDAiIHI9IjEzMCIgZmlsbD0iI2ZmZmZmZiIgZmlsdGVyPSJ1cmwoI2JsdXItbGVzcykiIG9wYWNpdHk9IjAuNyIvPgogIDxjaXJjbGUgY3g9IjE1MCIgY3k9IjQ1MCIgcj0iMTgwIiBmaWxsPSIjZmZmZmZmIiBmaWx0ZXI9InVybCgjYmx1ci1tZWRpdW0pIiBvcGFjaXR5PSIwLjYiLz4KICA8Y2lyY2xlIGN4PSI0NTAiIGN5PSI1MDAiIHI9IjE2MCIgZmlsbD0iI2ZmZmZmZiIgZmlsdGVyPSJ1cmwoI2JsdXItbWVkaXVtKSIgb3BhY2l0eT0iMC42Ii8+Cjwvc3ZnPg==',
  },
] as const;

export type ImagePresetId = typeof PRESET_BACKGROUND_IMAGES[number]['id'];

export const IMAGE_DISPLAY_MODES = {
  cover: { name: '铺满', value: 'cover', repeat: 'no-repeat', position: 'center', size: 'cover' },
  contain: { name: '居中', value: 'contain', repeat: 'no-repeat', position: 'center', size: 'contain' },
} as const;

export type ImageDisplayModeKey = keyof typeof IMAGE_DISPLAY_MODES;

export interface BackgroundSettings {
  type: BackgroundTypeKey;
  solidColor: string;
  gradientId: GradientPresetId;
  imageUrl: string;
  imageMode: ImageDisplayModeKey;
  isPresetImage: boolean;
  presetImageId: ImagePresetId | null;
}

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  type: 'solid',
  solidColor: '#ffffff',
  gradientId: 'blue-white',
  imageUrl: '',
  imageMode: 'cover',
  isPresetImage: false,
  presetImageId: null,
};

export interface AppearanceSettings {
  theme: ThemeKey;
  fontSize: FontSizeKey;
  codeHighlight: CodeHighlightKey;
  bubbleStyle: BubbleStyleKey;
  avatarShape: AvatarShapeKey;
  avatarBorder: AvatarBorderKey;
  background: BackgroundSettings;
}

export const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: 'default',
  fontSize: 'medium',
  codeHighlight: 'oneDark',
  bubbleStyle: 'relaxed',
  avatarShape: 'circle',
  avatarBorder: 'none',
  background: DEFAULT_BACKGROUND_SETTINGS,
};
