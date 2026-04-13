'use client';

import { useState } from 'react';

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
    description: '搜索互联网获取实时信息',
    example: '今天的天气怎么样？',
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

interface SkillPanelProps {
  visible: boolean;
  onClose: () => void;
  onInsertPrompt: (text: string) => void;
}

export default function SkillPanel({ visible, onClose, onInsertPrompt }: SkillPanelProps) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <h3 className="text-sm font-semibold text-gray-700">🛠️ 可用技能</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {SKILLS.map((skill) => (
          <button
            key={skill.name}
            onClick={() => {
              onInsertPrompt(skill.example);
              onClose();
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{skill.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{skill.label}</div>
                <div className="text-xs text-gray-500">{skill.description}</div>
              </div>
              <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                试一试 →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
