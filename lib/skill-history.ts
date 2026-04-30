const SKILL_HISTORY_KEY = 'ai_assistant_skill_history';
const MAX_HISTORY_SIZE = 30;
const DISPLAY_HISTORY_SIZE = 5;

export interface SkillHistoryItem {
  skillName: string;
  usedAt: string;
}

export interface SkillInfo {
  name: string;
  emoji: string;
  label: string;
  description: string;
  example: string;
}

export const SKILLS: SkillInfo[] = [
  {
    name: 'web_search',
    emoji: '🔍',
    label: '网络搜索',
    description: '搜索互联网获取实时新闻和事件',
    example: '今天有什么重要新闻？',
  },
  {
    name: 'weather',
    emoji: '🌤️',
    label: '天气查询',
    description: '查询实时天气和天气预报',
    example: '北京明天的天气怎么样？',
  },
  {
    name: 'code_execution',
    emoji: '💻',
    label: '代码执行',
    description: '执行 Python 代码，计算、处理数据',
    example: '用 Python 计算斐波那契数列前20项',
  },
  {
    name: 'calculator',
    emoji: '🧮',
    label: '数学计算',
    description: '精确数学计算，支持复杂表达式',
    example: '计算 (sqrt(2) + pi) * 100',
  },
  {
    name: 'text_analyzer',
    emoji: '📝',
    label: '文本分析',
    description: '摘要、关键词、情感分析',
    example: '分析这段文字的情感：今天天气真好，心情愉快！',
  },
  {
    name: 'translator',
    emoji: '🌐',
    label: '智能翻译',
    description: '多语言智能翻译',
    example: '把"人工智能正在改变世界"翻译成英文',
  },
];

export function getSkillByName(name: string): SkillInfo | undefined {
  return SKILLS.find((s) => s.name === name);
}

export function addSkillToHistory(skillName: string): void {
  try {
    const existing = localStorage.getItem(SKILL_HISTORY_KEY);
    const history: SkillHistoryItem[] = existing ? JSON.parse(existing) : [];

    const filtered = history.filter((item) => item.skillName !== skillName);

    const newItem: SkillHistoryItem = {
      skillName,
      usedAt: new Date().toISOString(),
    };

    filtered.unshift(newItem);

    const trimmed = filtered.slice(0, MAX_HISTORY_SIZE);

    localStorage.setItem(SKILL_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to add skill to history:', e);
  }
}

export function getSkillHistory(): SkillHistoryItem[] {
  try {
    const existing = localStorage.getItem(SKILL_HISTORY_KEY);
    const history: SkillHistoryItem[] = existing ? JSON.parse(existing) : [];
    return history.slice(0, DISPLAY_HISTORY_SIZE);
  } catch (e) {
    console.error('Failed to get skill history:', e);
    return [];
  }
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay === 1) return '昨天';
  if (diffDay < 7) return `${diffDay} 天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
