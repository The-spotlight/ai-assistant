'use client';

import { SKILLS, type Skill } from '@/lib/tools/quick-commands';

interface SkillPanelProps {
  visible: boolean;
  onClose: () => void;
  onInsertPrompt: (text: string) => void;
}

/** 浅色弹层，与输入区 / 顶栏 Vercel 风格一致 */
export default function SkillPanel({ visible, onClose, onInsertPrompt }: SkillPanelProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-30 mb-3 overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-label="可用技能"
    >
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] bg-[#fafafa] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#171717]">可用技能</h3>
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
        {SKILLS.map((skill) => (
          <button
            key={skill.name}
            type="button"
            onClick={() => {
              onInsertPrompt(skill.example);
              onClose();
            }}
            className="group w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[#fafafa]"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none">{skill.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[#171717]">{skill.label}</div>
                <div className="mt-0.5 text-xs leading-snug text-[#4d4d4d]">{skill.description}</div>
              </div>
              <span className="shrink-0 text-xs text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
                试试
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
