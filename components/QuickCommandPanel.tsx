'use client';

import { QUICK_COMMANDS } from '@/lib/tools/quick-commands';
import type { QuickCommand } from '@/lib/tools/quick-commands';

interface QuickCommandPanelProps {
  visible: boolean;
  commands: QuickCommand[];
  onSelectCommand: (command: QuickCommand) => void;
  selectedIndex: number;
  onClose: () => void;
}

export default function QuickCommandPanel({ 
  visible, 
  commands, 
  onSelectCommand,
  selectedIndex,
  onClose
}: QuickCommandPanelProps) {
  if (!visible || commands.length === 0) return null;

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
      <div className="max-h-64 overflow-y-auto bg-white p-2">
        {commands.map((cmd, index) => (
          <button
            key={cmd.command}
            type="button"
            onClick={() => onSelectCommand(cmd)}
            className={`group w-full rounded-md px-3 py-2.5 text-left transition-colors ${
              index === selectedIndex 
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
      </div>
    </div>
  );
}
