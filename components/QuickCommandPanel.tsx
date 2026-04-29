'use client';

import { COMMAND_ICONS } from '@/lib/settings';
import type { CustomCommand } from '@/lib/settings';
import type { QuickCommand } from '@/lib/tools/quick-commands';

interface QuickCommandPanelProps {
  visible: boolean;
  systemCommands: QuickCommand[];
  customCommands: CustomCommand[];
  onSelectSystemCommand: (command: QuickCommand) => void;
  onSelectCustomCommand: (command: CustomCommand) => void;
  selectedIndex: number;
  onClose: () => void;
}

export default function QuickCommandPanel({ 
  visible, 
  systemCommands, 
  customCommands,
  onSelectSystemCommand,
  onSelectCustomCommand,
  selectedIndex,
  onClose
}: QuickCommandPanelProps) {
  if (!visible || (systemCommands.length === 0 && customCommands.length === 0)) return null;

  const totalCommands = systemCommands.length + customCommands.length;
  const hasSystemCommands = systemCommands.length > 0;
  const hasCustomCommands = customCommands.length > 0;

  const getCommandAt = (index: number) => {
    if (index < systemCommands.length) {
      return { type: 'system' as const, command: systemCommands[index] };
    }
    return { type: 'custom' as const, command: customCommands[index - systemCommands.length] };
  };

  const handleSelectCommand = (index: number) => {
    const item = getCommandAt(index);
    if (item.type === 'system') {
      onSelectSystemCommand(item.command);
    } else {
      onSelectCustomCommand(item.command);
    }
  };

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-30 mb-3 overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-label="快捷指令"
    >
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] bg-[#fafafa] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#171717]">快捷指令</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#808080] transition-colors hover:bg-[#ebebeb] hover:text-[#171717]"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto bg-white p-2">
        {hasSystemCommands && systemCommands.map((cmd, index) => (
          <button
            key={`system-${cmd.command}`}
            type="button"
            onClick={() => handleSelectCommand(index)}
            className={`group w-full rounded-md px-3 py-2.5 text-left transition-colors ${
              selectedIndex === index 
                ? 'bg-[#f0f0f0]' 
                : 'hover:bg-[#fafafa]'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none font-mono text-[#171717]">
                /{cmd.command}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[#171717]">{cmd.name}</div>
                <div className="mt-0.5 text-xs leading-snug text-[#4d4d4d]">
                  {cmd.description}
                </div>
              </div>
              <span className="shrink-0 text-xs text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
                选择
              </span>
            </div>
          </button>
        ))}

        {hasSystemCommands && hasCustomCommands && (
          <div className="flex items-center px-3 py-2">
            <div className="flex-1 h-px bg-[#e5e5e5]" />
            <span className="mx-3 text-[10px] text-[#a3a3a3] font-medium">自定义</span>
            <div className="flex-1 h-px bg-[#e5e5e5]" />
          </div>
        )}

        {hasCustomCommands && customCommands.map((cmd, index) => {
          const globalIndex = systemCommands.length + index;
          return (
            <button
              key={`custom-${cmd.id}`}
              type="button"
              onClick={() => handleSelectCommand(globalIndex)}
              className={`group w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                selectedIndex === globalIndex 
                  ? 'bg-[#f0f0f0]' 
                  : 'hover:bg-[#fafafa]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">
                  {COMMAND_ICONS[cmd.icon as keyof typeof COMMAND_ICONS]?.emoji || '✨'}
                </span>
                <span className="text-lg leading-none font-mono text-[#171717]">
                  /{cmd.command}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#171717]">{cmd.name}</div>
                  <div className="mt-0.5 text-xs leading-snug text-[#4d4d4d]">
                    {cmd.description || cmd.prompt.slice(0, 50) + (cmd.prompt.length > 50 ? '...' : '')}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
                  选择
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}