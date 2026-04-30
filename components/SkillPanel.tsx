'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type SkillInfo,
  SKILLS,
  getSkillHistory,
  formatRelativeTime,
  type SkillHistoryItem,
} from '@/lib/skill-history';

interface SkillPanelProps {
  visible: boolean;
  onClose: () => void;
  onInsertPrompt: (text: string, skillName?: string) => void;
}

interface RecentSkillItemProps {
  skill: SkillInfo;
  historyItem: SkillHistoryItem;
  onClick: (skill: SkillInfo) => void;
}

function RecentSkillItem({ skill, historyItem, onClick }: RecentSkillItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(skill)}
      className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#fafafa]"
    >
      <span className="text-lg leading-none">{skill.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[#171717]">{skill.label}</div>
        <div className="mt-0.5 text-xs text-[#737373]">
          {formatRelativeTime(historyItem.usedAt)}
        </div>
      </div>
      <span className="shrink-0 text-xs text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
        试试
      </span>
    </button>
  );
}

interface AllSkillItemProps {
  skill: SkillInfo;
  onClick: (skill: SkillInfo) => void;
}

function AllSkillItem({ skill, onClick }: AllSkillItemProps) {
  return (
    <button
      key={skill.name}
      type="button"
      onClick={() => onClick(skill)}
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
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="flex-1 h-px bg-black/[0.06]" />
      <span className="text-xs font-medium text-[#737373] whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-black/[0.06]" />
    </div>
  );
}

export default function SkillPanel({ visible, onClose, onInsertPrompt }: SkillPanelProps) {
  const [history, setHistory] = useState<SkillHistoryItem[]>([]);

  useEffect(() => {
    if (visible) {
      setHistory(getSkillHistory());
    }
  }, [visible]);

  const handleSkillClick = useCallback(
    (skill: SkillInfo) => {
      onInsertPrompt(skill.example, skill.name);
      onClose();
    },
    [onInsertPrompt, onClose]
  );

  if (!visible) return null;

  const recentSkills = history
    .map((item) => {
      const skill = SKILLS.find((s) => s.name === item.skillName);
      return skill ? { skill, historyItem: item } : null;
    })
    .filter((item): item is { skill: SkillInfo; historyItem: SkillHistoryItem } => item !== null);

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
      <div className="max-h-80 overflow-y-auto bg-white p-2">
        {recentSkills.length > 0 && (
          <>
            <SectionHeader title="最近使用" />
            {recentSkills.map(({ skill, historyItem }) => (
              <RecentSkillItem
                key={`recent-${skill.name}`}
                skill={skill}
                historyItem={historyItem}
                onClick={handleSkillClick}
              />
            ))}
          </>
        )}

        <SectionHeader title="全部技能" />
        {SKILLS.map((skill) => (
          <AllSkillItem key={skill.name} skill={skill} onClick={handleSkillClick} />
        ))}
      </div>
    </div>
  );
}
