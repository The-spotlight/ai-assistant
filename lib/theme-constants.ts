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
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20geometric%20shapes%20soft%20blur%20minimalist%20pastel%20colors%20elegant%20background&image_size=square_hd',
  },
  {
    id: 'soft-texture',
    name: '淡雅纹理',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soft%20subtle%20texture%20minimalist%20elegant%20background%20neutral%20tones%20calming&image_size=square_hd',
  },
  {
    id: 'wave-pattern',
    name: '波浪图案',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smooth%20wave%20pattern%20minimalist%20soft%20colors%20abstract%20background%20elegant&image_size=square_hd',
  },
  {
    id: 'cloud-like',
    name: '云朵质感',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soft%20cloud%20like%20texture%20dreamy%20smooth%20pastel%20background%20minimalist&image_size=square_hd',
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
