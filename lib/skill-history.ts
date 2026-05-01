const SKILL_HISTORY_KEY = 'ai_assistant_skill_history';
const MAX_HISTORY_SIZE = 30;
const DISPLAY_HISTORY_SIZE = 5;

export interface SkillHistoryItem {
  skillId: string;
  usedAt: string;
}

export interface SkillParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface SkillInfo {
  id: string;
  name: string;
  emoji: string;
  label: string;
  description: string;
  example: string;
  detailedDescription: string;
  useCases: string[];
  parameters: SkillParameter[];
}

export const SKILLS: SkillInfo[] = [
  {
    id: 'skill_web_search_v1',
    name: 'web_search',
    emoji: '🔍',
    label: '网络搜索',
    description: '搜索互联网获取实时新闻和事件',
    example: '今天有什么重要新闻？',
    detailedDescription: '网络搜索技能能够实时访问互联网，获取最新的新闻、事件、事实信息和研究资料。支持关键词搜索、自然语言提问等多种查询方式，返回经过筛选的高质量搜索结果。',
    useCases: [
      '查询最新新闻事件和热点话题',
      '获取实时市场数据和股价信息',
      '研究特定主题的背景资料',
      '查找产品评测和用户反馈',
      '验证事实信息的准确性',
    ],
    parameters: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: '搜索关键词或自然语言问题',
      },
      {
        name: 'num_results',
        type: 'number',
        required: false,
        description: '返回结果数量，默认 5 条，最多 20 条',
      },
    ],
  },
  {
    id: 'skill_weather_v1',
    name: 'weather',
    emoji: '🌤️',
    label: '天气查询',
    description: '查询实时天气和天气预报',
    example: '北京明天的天气怎么样？',
    detailedDescription: '天气查询技能提供全球城市的实时天气数据和天气预报。支持查询当前天气、未来几天预报、空气质量指数、紫外线指数等气象信息。支持城市名称、地理位置坐标等多种查询方式。',
    useCases: [
      '查询当前实时天气状况',
      '获取未来 7 天天气预报',
      '了解空气质量和污染指数',
      '查看日出日落时间',
      '规划出行前的天气准备',
    ],
    parameters: [
      {
        name: 'city',
        type: 'string',
        required: true,
        description: '城市名称，如"北京"、"上海"、"New York"',
      },
      {
        name: 'days',
        type: 'number',
        required: false,
        description: '预报天数，默认 1 天（今天），最多 7 天',
      },
      {
        name: 'unit',
        type: 'string',
        required: false,
        description: '温度单位："celsius" 摄氏度 或 "fahrenheit" 华氏度',
      },
    ],
  },
  {
    id: 'skill_code_execution_v1',
    name: 'code_execution',
    emoji: '💻',
    label: '代码执行',
    description: '执行 Python 代码，计算、处理数据',
    example: '用 Python 计算斐波那契数列前20项',
    detailedDescription: '代码执行技能提供安全的 Python 代码执行环境，可以运行数据计算、算法实现、数据可视化等代码。支持 NumPy、Pandas、Matplotlib 等常用数据科学库。代码在隔离沙箱中执行，确保安全性。',
    useCases: [
      '执行数学计算和数值运算',
      '实现和测试算法逻辑',
      '数据处理和统计分析',
      '生成图表和数据可视化',
      '学习和调试 Python 代码',
    ],
    parameters: [
      {
        name: 'code',
        type: 'string',
        required: true,
        description: '要执行的 Python 代码',
      },
      {
        name: 'timeout',
        type: 'number',
        required: false,
        description: '执行超时时间（秒），默认 30 秒',
      },
    ],
  },
  {
    id: 'skill_calculator_v1',
    name: 'calculator',
    emoji: '🧮',
    label: '数学计算',
    description: '精确数学计算，支持复杂表达式',
    example: '计算 (sqrt(2) + pi) * 100',
    detailedDescription: '数学计算技能提供高精度的数学运算能力，支持基本算术、三角函数、对数函数、指数函数等多种数学运算。支持自然语言数学表达式输入，返回精确计算结果。',
    useCases: [
      '日常算术计算',
      '科学计算和工程计算',
      '财务计算和百分比计算',
      '单位换算',
      '解方程和求根',
    ],
    parameters: [
      {
        name: 'expression',
        type: 'string',
        required: true,
        description: '数学表达式，如 "2 + 3 * 4" 或 "sin(pi/2)"',
      },
      {
        name: 'precision',
        type: 'number',
        required: false,
        description: '计算精度，小数点后位数，默认 10 位',
      },
    ],
  },
  {
    id: 'skill_text_analyzer_v1',
    name: 'text_analyzer',
    emoji: '📝',
    label: '文本分析',
    description: '摘要、关键词、情感分析',
    example: '分析这段文字的情感：今天天气真好，心情愉快！',
    detailedDescription: '文本分析技能提供多种文本处理能力，包括自动摘要提取、关键词识别、情感倾向分析、文本分类等。支持中英文文本，能够智能理解文本内容并生成结构化分析结果。',
    useCases: [
      '生成文章或文档的摘要',
      '提取文本中的关键词和主题',
      '分析评论的情感倾向（正面/负面/中性）',
      '识别文本的语言和主题分类',
      '统计词频和文本特征',
    ],
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: '要分析的文本内容',
      },
      {
        name: 'task',
        type: 'string',
        required: false,
        description: '分析任务类型："summary" 摘要、"keywords" 关键词、"sentiment" 情感、"all" 全部分析',
      },
      {
        name: 'language',
        type: 'string',
        required: false,
        description: '文本语言："zh" 中文、"en" 英文，自动检测',
      },
    ],
  },
  {
    id: 'skill_translator_v1',
    name: 'translator',
    emoji: '🌐',
    label: '智能翻译',
    description: '多语言智能翻译',
    example: '把"人工智能正在改变世界"翻译成英文',
    detailedDescription: '智能翻译技能提供高质量的多语言互译能力，支持中英文及多种主流语言之间的翻译。采用先进的神经网络翻译模型，能够理解上下文语境，提供准确自然的翻译结果。',
    useCases: [
      '中英文互译',
      '翻译邮件和文档',
      '理解外文网页和文章',
      '多语言商务沟通',
      '学习外语辅助工具',
    ],
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: '要翻译的文本',
      },
      {
        name: 'source_lang',
        type: 'string',
        required: false,
        description: '源语言代码，如 "zh" 中文、"en" 英文，自动检测',
      },
      {
        name: 'target_lang',
        type: 'string',
        required: false,
        description: '目标语言代码，如 "zh" 中文、"en" 英文，默认翻译成中文',
      },
    ],
  },
];

export function getSkillById(id: string): SkillInfo | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function getSkillByName(name: string): SkillInfo | undefined {
  return SKILLS.find((s) => s.name === name);
}

export function addSkillToHistory(skillId: string): void {
  try {
    const existing = localStorage.getItem(SKILL_HISTORY_KEY);
    const history: SkillHistoryItem[] = existing ? JSON.parse(existing) : [];

    const filtered = history.filter((item) => item.skillId !== skillId);

    const newItem: SkillHistoryItem = {
      skillId,
      usedAt: new Date().toISOString(),
    };

    filtered.unshift(newItem);

    const trimmed = filtered.slice(0, MAX_HISTORY_SIZE);

    localStorage.setItem(SKILL_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to add skill to history:', e);
  }
}

interface LegacySkillHistoryItem {
  skillName: string;
  usedAt: string;
}

function isLegacyItem(
  item: SkillHistoryItem | LegacySkillHistoryItem
): item is LegacySkillHistoryItem {
  return 'skillName' in item && !('skillId' in item);
}

function convertLegacyItem(item: LegacySkillHistoryItem): SkillHistoryItem | null {
  const skill = getSkillByName(item.skillName);
  if (skill) {
    return {
      skillId: skill.id,
      usedAt: item.usedAt,
    };
  }
  return null;
}

export function getSkillHistory(): SkillHistoryItem[] {
  try {
    const existing = localStorage.getItem(SKILL_HISTORY_KEY);
    if (!existing) return [];

    const rawHistory: Array<SkillHistoryItem | LegacySkillHistoryItem> = JSON.parse(existing);
    
    const convertedHistory: SkillHistoryItem[] = [];
    const seenIds = new Set<string>();
    let hasLegacyItems = false;

    for (const item of rawHistory) {
      if (isLegacyItem(item)) {
        hasLegacyItems = true;
        const converted = convertLegacyItem(item);
        if (converted && !seenIds.has(converted.skillId)) {
          seenIds.add(converted.skillId);
          convertedHistory.push(converted);
        }
      } else {
        if (!seenIds.has(item.skillId)) {
          seenIds.add(item.skillId);
          convertedHistory.push(item);
        }
      }
    }

    if (hasLegacyItems && convertedHistory.length > 0) {
      localStorage.setItem(SKILL_HISTORY_KEY, JSON.stringify(convertedHistory));
    }

    return convertedHistory.slice(0, DISPLAY_HISTORY_SIZE);
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
