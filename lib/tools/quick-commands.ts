export interface QuickCommand {
  name: string;
  command: string;
  description: string;
  toolName: string;
  parameterName: string;
  example: string;
}

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
    example: '/执行 print(\"Hello World\")',
  },
];

export function parseQuickCommand(input: string): { 
  command: QuickCommand | null; 
  argument: string | null;
  isCommand: boolean;
} {
  if (!input.startsWith('/')) {
    return { command: null, argument: null, isCommand: false };
  }

  const commandPart = input.slice(1);
  if (!commandPart) {
    return { command: null, argument: null, isCommand: true };
  }

  const firstSpaceIndex = commandPart.indexOf(' ');
  const commandName = firstSpaceIndex === -1 
    ? commandPart.trim() 
    : commandPart.slice(0, firstSpaceIndex).trim();
  const argument = firstSpaceIndex === -1 
    ? null 
    : commandPart.slice(firstSpaceIndex + 1);

  const matchedCommand = QUICK_COMMANDS.find(
    (cmd) => cmd.command === commandName || cmd.name === commandName
  );

  return { 
    command: matchedCommand || null, 
    argument: argument,
    isCommand: true
  };
}

export function getMatchingCommands(input: string): QuickCommand[] {
  if (!input.startsWith('/')) {
    return [];
  }

  const commandPart = input.slice(1).trim().toLowerCase();
  if (!commandPart) {
    return QUICK_COMMANDS;
  }

  return QUICK_COMMANDS.filter(
    (cmd) => 
      cmd.command.toLowerCase().startsWith(commandPart) ||
      cmd.name.toLowerCase().startsWith(commandPart)
  );
}
