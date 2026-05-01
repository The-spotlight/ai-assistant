'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Collapse,
  Button,
  Tag,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import {
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
  Settings,
  FileText,
} from 'lucide-react';
import type {
  SkillInfo,
  SkillParameter,
  SkillHistoryItem,
} from '@/lib/skill-history';
import {
  getSkillById,
  getSkillHistory,
  formatRelativeTime,
  SKILLS,
} from '@/lib/skill-history';

const { Panel } = Collapse;

interface SkillPanelProps {
  visible: boolean;
  onClose: () => void;
  onInsertPrompt: (text: string, skillId?: string) => void;
}

interface SkillDetailContentProps {
  skill: SkillInfo;
  onUseSkill: (e: React.MouseEvent) => void;
}

function SkillDetailContent({ skill, onUseSkill }: SkillDetailContentProps) {
  return (
    <div className="py-2 px-1">
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-700">
          <Info className="w-3.5 h-3.5" />
          <span>功能说明</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed pl-5">
          {skill.detailedDescription}
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>使用场景</span>
        </div>
        <ul className="space-y-1.5 pl-5">
          {skill.useCases.map((useCase, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="shrink-0 text-gray-400 mt-0.5">•</span>
              <span>{useCase}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-700">
          <Settings className="w-3.5 h-3.5" />
          <span>参数说明</span>
        </div>
        <div className="space-y-2 pl-5">
          {skill.parameters.map((param: SkillParameter, index: number) => (
            <div key={index} className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs font-mono text-gray-800 bg-gray-200 px-1.5 py-0.5 rounded">
                  {param.name}
                </code>
                <Tag size="small" className="m-0">
                  {param.type}
                </Tag>
                {param.required && (
                  <Tag color="error" size="small" className="m-0">
                    必填
                  </Tag>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-600">{param.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-700">
          <FileText className="w-3.5 h-3.5" />
          <span>示例</span>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100 pl-5">
          <p className="text-xs text-gray-600 italic">"{skill.example}"</p>
        </div>
      </div>

      <div className="flex gap-2 pl-5">
        <Button type="primary" size="small" onClick={onUseSkill} block>
          使用这个技能
        </Button>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function SkillPanel({ visible, onClose, onInsertPrompt }: SkillPanelProps) {
  const [history, setHistory] = useState<SkillHistoryItem[]>([]);
  const [skills, setSkills] = useState<SkillInfo[]>(SKILLS);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || SKILLS);
      } else {
        setSkills(SKILLS);
      }
    } catch {
      setSkills(SKILLS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setHistory(getSkillHistory());
      setExpandedKeys([]);
      fetchSkills();
    }
  }, [visible, fetchSkills]);

  const handlePanelChange = useCallback((keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const expandedKey = keysArray.length > 0 ? keysArray[keysArray.length - 1] : null;
    setExpandedKeys(expandedKey ? [expandedKey] : []);
  }, []);

  const handleUseSkill = useCallback(
    (skill: SkillInfo, e: React.MouseEvent) => {
      e.stopPropagation();
      onInsertPrompt(skill.example, skill.id);
      onClose();
    },
    [onInsertPrompt, onClose]
  );

  const handleQuickUse = useCallback(
    (skill: SkillInfo, e: React.MouseEvent) => {
      e.stopPropagation();
      onInsertPrompt(skill.example, skill.id);
      onClose();
    },
    [onInsertPrompt, onClose]
  );

  if (!visible) return null;

  const recentSkills = history
    .map((item) => {
      const skill = skills.find((s) => s.id === item.skillId);
      return skill ? { skill, historyItem: item } : null;
    })
    .filter((item): item is { skill: SkillInfo; historyItem: SkillHistoryItem } => item !== null);

  const recentSkillIds = recentSkills.map((item) => item.skill.id);
  const otherSkills = skills.filter((skill) => !recentSkillIds.includes(skill.id));

  const customExpandIcon = ({ isActive }: { isActive?: boolean }) => (
    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
  );

  const renderSkillPanel = (skill: SkillInfo, key: string, timeLabel?: string) => (
    <Panel
      key={key}
      header={
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-lg leading-none">{skill.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                {skill.label}
                {timeLabel && (
                  <span className="text-xs text-gray-400 font-normal">
                    {timeLabel}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs leading-snug text-gray-500 truncate">
                {skill.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip title="快速使用">
              <Button
                type="text"
                size="small"
                onClick={(e) => handleQuickUse(skill, e)}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                试试
              </Button>
            </Tooltip>
          </div>
        </div>
      }
      showArrow={true}
      expandIcon={customExpandIcon}
    >
      <SkillDetailContent skill={skill} onUseSkill={(e) => handleUseSkill(skill, e)} />
    </Panel>
  );

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-30 mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
      role="dialog"
      aria-label="可用技能"
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">可用技能</h3>
        <Button
          type="text"
          size="small"
          onClick={onClose}
          icon={<span className="text-lg leading-none text-gray-400">×</span>}
          className="h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-200 rounded-lg"
          aria-label="关闭"
        />
      </div>

      <div className="max-h-96 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spin size="small" />
          </div>
        ) : skills.length === 0 ? (
          <div className="py-8">
            <Empty description="暂无可用技能" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <Collapse
            bordered={false}
            activeKey={expandedKeys}
            onChange={handlePanelChange}
            className="bg-transparent"
            expandIconPosition="end"
          >
            {recentSkills.length > 0 && (
              <>
                <SectionHeader title="最近使用" />
                {recentSkills.map(({ skill, historyItem }) =>
                  renderSkillPanel(skill, `recent-${skill.id}`, formatRelativeTime(historyItem.usedAt))
                )}
              </>
            )}

            {otherSkills.length > 0 && (
              <>
                <SectionHeader title="全部技能" />
                {otherSkills.map((skill) =>
                  renderSkillPanel(skill, `all-${skill.id}`)
                )}
              </>
            )}
          </Collapse>
        )}
      </div>
    </div>
  );
}
