export interface QuickCommand {
  name: string;
  command: string;
  description: string;
  toolName: string;
  parameterName: string;
  example: string;
}

export interface CustomCommand {
  id: string;
  name: string;
  command: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface Skill {
  name: string;
  emoji: string;
  label: string;
  description: string;
  example: string;
}

export const SKILLS: Skill[] = [
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

export const QUICK_COMMANDS: QuickCommand[] = [
  {
    name: '搜索',
    command: '搜索',
    description: '搜索互联网获取实时信息',
    toolName: 'web_search',
    parameterName: 'query',
    example: '/搜索 最新科技新闻',
  },
  {
    name: '天气',
    command: '天气',
    description: '查询实时天气和天气预报',
    toolName: 'weather',
    parameterName: 'location',
    example: '/天气 北京',
  },
  {
    name: '计算',
    command: '计算',
    description: '执行精确数学计算',
    toolName: 'calculator',
    parameterName: 'expression',
    example: '/计算 2+3*4',
  },
  {
    name: '翻译',
    command: '翻译',
    description: '多语言智能翻译',
    toolName: 'translator',
    parameterName: 'text',
    example: '/翻译 你好世界',
  },
  {
    name: '分析',
    command: '分析',
    description: '文本分析（摘要、关键词、情感）',
    toolName: 'text_analyzer',
    parameterName: 'text',
    example: '/分析 今天天气真好，心情愉快！',
  },
  {
    name: '执行',
    command: '执行',
    description: '执行 Python 代码',
    toolName: 'code_execution',
    parameterName: 'code',
    example: '/执行 print("Hello World")',
  },
];

export function parseQuickCommand(input: string, customCommands: CustomCommand[] = []): { 
  systemCommand: QuickCommand | null; 
  customCommand: CustomCommand | null;
  argument: string | null;
  isCommand: boolean;
} {
  if (!input.startsWith('/')) {
    return { systemCommand: null, customCommand: null, argument: null, isCommand: false };
  }

  const commandPart = input.slice(1);
  if (!commandPart) {
    return { systemCommand: null, customCommand: null, argument: null, isCommand: true };
  }

  const firstSpaceIndex = commandPart.indexOf(' ');
  const commandName = firstSpaceIndex === -1 
    ? commandPart.trim() 
    : commandPart.slice(0, firstSpaceIndex).trim();
  const argument = firstSpaceIndex === -1 
    ? null 
    : commandPart.slice(firstSpaceIndex + 1);

  const matchedSystemCommand = QUICK_COMMANDS.find(
    (cmd) => cmd.command === commandName || cmd.name === commandName
  );

  if (matchedSystemCommand) {
    return { 
      systemCommand: matchedSystemCommand, 
      customCommand: null,
      argument: argument,
      isCommand: true
    };
  }

  const matchedCustomCommand = customCommands.find(
    (cmd) => cmd.command === commandName || cmd.name === commandName
  );

  return { 
    systemCommand: null, 
    customCommand: matchedCustomCommand || null,
    argument: argument,
    isCommand: true
  };
}

export function getMatchingCommands(input: string, customCommands: CustomCommand[] = []): {
  systemCommands: QuickCommand[];
  customCommands: CustomCommand[];
} {
  if (!input.startsWith('/')) {
    return { systemCommands: [], customCommands: [] };
  }

  const commandPart = input.slice(1).trim().toLowerCase();
  if (!commandPart) {
    return { systemCommands: QUICK_COMMANDS, customCommands };
  }

  const matchedSystemCommands = QUICK_COMMANDS.filter(
    (cmd) => 
      cmd.command.toLowerCase().startsWith(commandPart) ||
      cmd.name.toLowerCase().startsWith(commandPart)
  );

  const matchedCustomCommands = customCommands.filter(
    (cmd) => 
      cmd.command.toLowerCase().startsWith(commandPart) ||
      cmd.name.toLowerCase().startsWith(commandPart)
  );

  return { systemCommands: matchedSystemCommands, customCommands: matchedCustomCommands };
}