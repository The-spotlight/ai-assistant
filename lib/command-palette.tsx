'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { QUICK_COMMANDS, type QuickCommand } from './tools/quick-commands';
import { loadCustomCommands, COMMAND_ICONS, type CustomCommand as SettingsCustomCommand } from './settings';

interface Skill {
  name: string;
  emoji: string;
  label: string;
  description: string;
  example: string;
}

const SKILLS: Skill[] = [
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

export type CommandType = 'quick-command' | 'skill' | 'custom-command';

export interface CommandItem {
  id: string;
  type: CommandType;
  icon: string;
  name: string;
  label: string;
  description: string;
  example?: string;
  command?: string;
  toolName?: string;
  parameterName?: string;
  prompt?: string;
}

export function convertQuickCommandToItem(cmd: QuickCommand): CommandItem {
  return {
    id: `quick-${cmd.command}`,
    type: 'quick-command',
    icon: getQuickCommandIcon(cmd.toolName),
    name: cmd.name,
    label: cmd.name,
    description: cmd.description,
    command: cmd.command,
    toolName: cmd.toolName,
    parameterName: cmd.parameterName,
    example: cmd.example,
  };
}

export function convertSkillToItem(skill: Skill): CommandItem {
  return {
    id: `skill-${skill.name}`,
    type: 'skill',
    icon: skill.emoji,
    name: skill.name,
    label: skill.label,
    description: skill.description,
    example: skill.example,
  };
}

export function convertCustomCommandToItem(cmd: SettingsCustomCommand): CommandItem {
  return {
    id: `custom-${cmd.id}`,
    type: 'custom-command',
    icon: COMMAND_ICONS[cmd.icon as keyof typeof COMMAND_ICONS]?.emoji || '✨',
    name: cmd.name,
    label: cmd.name,
    description: cmd.description || cmd.prompt.slice(0, 50) + (cmd.prompt.length > 50 ? '...' : ''),
    command: cmd.command,
    prompt: cmd.prompt,
  };
}

function getQuickCommandIcon(toolName: string): string {
  const iconMap: Record<string, string> = {
    web_search: '🔍',
    weather: '🌤️',
    calculator: '🧮',
    translator: '🌐',
    text_analyzer: '📝',
    code_execution: '💻',
  };
  return iconMap[toolName] || '⚡';
}

export function getAllCommands(customCommands: SettingsCustomCommand[] = []): CommandItem[] {
  const quickCommands: CommandItem[] = QUICK_COMMANDS.map(convertQuickCommandToItem);
  const skills: CommandItem[] = SKILLS.map(convertSkillToItem);
  const customs: CommandItem[] = customCommands.map(convertCustomCommandToItem);
  
  return [...quickCommands, ...skills, ...customs];
}

export function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  if (!query.trim()) return commands;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return commands.filter((cmd) => 
    cmd.label.toLowerCase().includes(lowerQuery) ||
    cmd.name.toLowerCase().includes(lowerQuery) ||
    cmd.description.toLowerCase().includes(lowerQuery) ||
    (cmd.command && cmd.command.toLowerCase().includes(lowerQuery)) ||
    (cmd.example && cmd.example.toLowerCase().includes(lowerQuery))
  );
}

export interface CommandExecutor {
  executeQuickCommand: (command: string) => void;
  executeSkill: (example: string) => void;
  executeCustomCommand: (prompt: string) => void;
}

interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  customCommands: SettingsCustomCommand[];
  refreshCustomCommands: () => void;
  executeCommand: (command: CommandItem) => void;
  registerExecutor: (executor: CommandExecutor) => void;
  unregisterExecutor: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customCommands, setCustomCommands] = useState<SettingsCustomCommand[]>([]);
  const [executor, setExecutor] = useState<CommandExecutor | null>(null);

  const refreshCustomCommands = useCallback(() => {
    if (typeof window !== 'undefined') {
      setCustomCommands(loadCustomCommands());
    }
  }, []);

  useEffect(() => {
    refreshCustomCommands();
  }, [refreshCustomCommands]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const registerExecutor = useCallback((exec: CommandExecutor) => {
    setExecutor(exec);
  }, []);

  const unregisterExecutor = useCallback(() => {
    setExecutor(null);
  }, []);

  const executeCommand = useCallback((command: CommandItem) => {
    if (!executor) {
      console.warn('No command executor registered');
      return;
    }

    close();

    switch (command.type) {
      case 'quick-command':
        if (command.command) {
          executor.executeQuickCommand(command.command);
        }
        break;
      case 'skill':
        if (command.example) {
          executor.executeSkill(command.example);
        }
        break;
      case 'custom-command':
        if (command.prompt) {
          executor.executeCustomCommand(command.prompt);
        }
        break;
    }
  }, [executor, close]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        customCommands,
        refreshCustomCommands,
        executeCommand,
        registerExecutor,
        unregisterExecutor,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}

export function useRegisterCommandExecutor(executor: CommandExecutor) {
  const { registerExecutor, unregisterExecutor } = useCommandPalette();

  useEffect(() => {
    registerExecutor(executor);
    return () => unregisterExecutor();
  }, [executor, registerExecutor, unregisterExecutor]);
}
