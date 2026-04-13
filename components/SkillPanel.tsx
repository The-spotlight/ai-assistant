'use client';

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
    <div className="absolute bottom-full left-0 right-0 z-30 mb-3 overflow-hidden rounded-linear-lg border border-linear-border bg-linear-panel shadow-linear-lg">
      <div className="flex items-center justify-between border-b border-linear-border px-4 py-3">
        <h3 className="text-sm font-semibold text-linear-primary">可用技能</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-linear text-linear-tertiary transition-colors hover:bg-linear-deep hover:text-linear-primary"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {SKILLS.map((skill) => (
          <button
            key={skill.name}
            type="button"
            onClick={() => {
              onInsertPrompt(skill.example);
              onClose();
            }}
            className="group w-full rounded-linear px-3 py-2.5 text-left transition-colors hover:bg-linear-hover"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none">{skill.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-linear-primary">{skill.label}</div>
                <div className="mt-0.5 text-xs leading-snug text-linear-tertiary">{skill.description}</div>
              </div>
              <span className="shrink-0 text-xs text-linear-brand opacity-0 transition-opacity group-hover:opacity-100">
                试试
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
