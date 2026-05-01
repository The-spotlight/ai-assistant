'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type SkillInfo,
  type SkillParameter,
  SKILLS,
  getSkillById,
  getSkillHistory,
  formatRelativeTime,
  type SkillHistoryItem,
} from '@/lib/skill-history';

interface SkillPanelProps {
  visible: boolean;
  onClose: () => void;
  onInsertPrompt: (text: string, skillId?: string) => void;
}

interface SkillDetailProps {
  skill: SkillInfo;
  onUseSkill: () => void;
}

function SkillDetail({ skill, onUseSkill }: SkillDetailProps) {
  return (
    <div className="mt-3 border-t border-[rgba(0,0,0,0.06)] pt-3">
      <div className="mb-3">
        <div className="text-xs font-semibold text-[#171717] mb-1.5">功能说明</div>
        <p className="text-xs text-[#4d4d4d] leading-relaxed">
          {skill.detailedDescription}
        </p>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-[#171717] mb-1.5">使用场景</div>
        <ul className="space-y-1">
          {skill.useCases.map((useCase, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-[#4d4d4d]">
              <span className="shrink-0 text-[#808080]">•</span>
              <span>{useCase}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-[#171717] mb-1.5">参数说明</div>
        <div className="space-y-2">
          {skill.parameters.map((param: SkillParameter, index: number) => (
            <div key={index} className="rounded-md bg-[#fafafa] p-2">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-[#171717]">{param.name}</code>
                <span className="text-[10px] text-[#737373]">{param.type}</span>
                {param.required && (
                  <span className="text-[10px] text-[#dc2626]">必填</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#4d4d4d]">{param.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-[#171717] mb-1.5">示例</div>
        <div className="rounded-md bg-[#fafafa] p-2">
          <p className="text-xs text-[#4d4d4d] italic">"{skill.example}"</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUseSkill();
          }}
          className="flex-1 rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#404040]"
        >
          使用这个技能
        </button>
      </div>
    </div>
  );
}

interface RecentSkillItemProps {
  skill: SkillInfo;
  historyItem: SkillHistoryItem;
  isExpanded: boolean;
  onClick: (skill: SkillInfo) => void;
  onUseSkill: (skill: SkillInfo) => void;
}

function RecentSkillItem({
  skill,
  historyItem,
  isExpanded,
  onClick,
  onUseSkill,
}: RecentSkillItemProps) {
  return (
    <div
      className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
        isExpanded ? 'bg-[#f5f5f5]' : 'hover:bg-[#fafafa]'
      }`}
    >
      <button
        type="button"
        onClick={() => onClick(skill)}
        className="group flex w-full items-center gap-3"
      >
        <span className="text-lg leading-none">{skill.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[#171717]">{skill.label}</div>
          <div className="mt-0.5 text-xs text-[#737373]">
            {formatRelativeTime(historyItem.usedAt)}
          </div>
        </div>
        <span
          className={`shrink-0 text-xs text-neutral-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>
      {isExpanded && (
        <SkillDetail skill={skill} onUseSkill={() => onUseSkill(skill)} />
      )}
    </div>
  );
}

interface AllSkillItemProps {
  skill: SkillInfo;
  isExpanded: boolean;
  onClick: (skill: SkillInfo) => void;
  onUseSkill: (skill: SkillInfo) => void;
}

function AllSkillItem({ skill, isExpanded, onClick, onUseSkill }: AllSkillItemProps) {
  return (
    <div
      className={`w-full rounded-md px-3 py-2.5 text-left transition-colors ${
        isExpanded ? 'bg-[#f5f5f5]' : 'hover:bg-[#fafafa]'
      }`}
    >
      <button
        type="button"
        onClick={() => onClick(skill)}
        className="group flex w-full items-start gap-3"
      >
        <span className="text-lg leading-none">{skill.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[#171717]">{skill.label}</div>
          <div className="mt-0.5 text-xs leading-snug text-[#4d4d4d]">{skill.description}</div>
        </div>
        <span
          className={`shrink-0 text-xs text-neutral-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>
      {isExpanded && (
        <SkillDetail skill={skill} onUseSkill={() => onUseSkill(skill)} />
      )}
    </div>
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
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setHistory(getSkillHistory());
      setExpandedSkillId(null);
    }
  }, [visible]);

  const handleSkillClick = useCallback(
    (skill: SkillInfo) => {
      setExpandedSkillId((prev) => (prev === skill.id ? null : skill.id));
    },
    []
  );

  const handleUseSkill = useCallback(
    (skill: SkillInfo) => {
      onInsertPrompt(skill.example, skill.id);
      onClose();
    },
    [onInsertPrompt, onClose]
  );

  if (!visible) return null;

  const recentSkills = history
    .map((item) => {
      const skill = getSkillById(item.skillId);
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
      <div className="max-h-96 overflow-y-auto bg-white p-2">
        {recentSkills.length > 0 && (
          <>
            <SectionHeader title="最近使用" />
            {recentSkills.map(({ skill, historyItem }) => (
              <RecentSkillItem
                key={`recent-${skill.id}`}
                skill={skill}
                historyItem={historyItem}
                isExpanded={expandedSkillId === skill.id}
                onClick={handleSkillClick}
                onUseSkill={handleUseSkill}
              />
            ))}
          </>
        )}

        <SectionHeader title="全部技能" />
        {SKILLS.map((skill) => (
          <AllSkillItem
            key={skill.id}
            skill={skill}
            isExpanded={expandedSkillId === skill.id}
            onClick={handleSkillClick}
            onUseSkill={handleUseSkill}
          />
        ))}
      </div>
    </div>
  );
}
