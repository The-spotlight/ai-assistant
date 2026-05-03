'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

type TemplateItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

type MarketTemplateItem = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  usageCount: number;
  isOfficial: boolean;
};

type TabType = 'my' | 'market';

const CATEGORIES = ['工作', '学习', '生活', '其他'];
const ALL_CATEGORIES = ['全部', ...CATEGORIES];
const MARKET_CATEGORIES = ['全部', '工作', '学习', '生活'];

const MARKET_TEMPLATES: MarketTemplateItem[] = [
  {
    id: 'market-translation-helper',
    title: '翻译助手',
    description: '专业翻译模板，支持多语言互译，保持原文风格和专业术语准确性。',
    content: `请将以下内容翻译为【目标语言】。

要求：
1. 保持原文的语气和风格
2. 专业术语要准确
3. 语句要自然流畅
4. 如有歧义，请注明

原文：
【粘贴需要翻译的内容】

请提供翻译结果。`,
    category: '工作',
    usageCount: 12580,
    isOfficial: true,
  },
  {
    id: 'market-code-review',
    title: '代码审查',
    description: '专业代码审查模板，帮助发现代码中的问题并提供改进建议。',
    content: `请帮我审查以下代码，从以下几个方面进行分析：

【代码】
\`\`\`
【粘贴你的代码】
\`\`\`

请从以下维度进行审查：
1. **代码质量**：是否有明显的 bug、潜在的问题
2. **性能优化**：是否有可以优化的地方
3. **代码规范**：是否符合最佳实践
4. **安全问题**：是否存在安全隐患
5. **改进建议**：具体的优化建议

请提供详细的审查报告。`,
    category: '工作',
    usageCount: 9870,
    isOfficial: true,
  },
  {
    id: 'market-copywriting',
    title: '文案写作',
    description: '专业文案创作模板，适用于产品推广、营销活动等场景。',
    content: `请帮我撰写一篇【文案类型】文案。

**产品/服务**：【产品名称/服务内容】
**目标受众**：【描述你的目标用户】
**核心卖点**：
1. 【卖点1】
2. 【卖点2】
3. 【卖点3】

**要求**：
- 文案风格：【例如：专业正式/轻松活泼/文艺清新/激情澎湃】
- 字数要求：【例如：100字以内/300字左右/500字以上】
- 特殊要求：【其他要求】

请提供多个版本供选择，并说明每个版本的特点。`,
    category: '工作',
    usageCount: 15620,
    isOfficial: true,
  },
  {
    id: 'market-study-plan',
    title: '学习计划',
    description: '系统化学习规划模板，帮助制定高效的学习路线图。',
    content: `请帮我制定一个学习计划。

**学习目标**：
【描述你想要达成的学习目标，例如：掌握 Python 编程、通过英语六级考试等】

**当前水平**：
【描述你目前的基础和水平】

**可用时间**：
- 每周学习时长：【例如：10小时】
- 预计学习周期：【例如：3个月】
- 每天可学习时段：【例如：晚上 8-10 点】

**优先关注点**：
【例如：理论基础、实践应用、应试技巧等】

请帮我制定一个详细的学习计划，包括：
1. 整体学习路线图
2. 分阶段目标
3. 每周学习安排
4. 推荐的学习资源
5. 检验学习效果的方法`,
    category: '学习',
    usageCount: 8950,
    isOfficial: true,
  },
  {
    id: 'market-meeting-minutes',
    title: '会议纪要',
    description: '专业会议记录模板，帮助整理会议要点、决策和行动项。',
    content: `请帮我整理会议纪要。

**会议基本信息**：
- 会议主题：【会议主题】
- 会议时间：【时间】
- 参会人员：【参会人名单】
- 会议类型：【例如：周会/项目评审/问题讨论】

**会议内容**：
【粘贴会议记录或录音转写内容】

请按以下结构整理会议纪要：

1. **会议概要**
   - 会议目的
   - 主要议题

2. **讨论要点**
   - 每个议题的讨论内容
   - 不同观点和意见

3. **会议决议**
   - 达成的共识
   - 做出的决策

4. **行动项**
   | 任务内容 | 负责人 | 截止时间 | 优先级 |
   |---------|--------|---------|--------|
   |         |        |         |        |

5. **下次会议安排**（如有）

6. **附录**
   - 相关文档
   - 参考资料`,
    category: '工作',
    usageCount: 11230,
    isOfficial: true,
  },
  {
    id: 'market-weekly-report',
    title: '周报生成',
    description: '高效周报模板，帮助总结本周工作并规划下周任务。',
    content: `请帮我撰写本周周报。

**本周工作内容**：

【请列出本周完成的工作，或粘贴相关聊天记录/任务列表】

**工作数据**（可选）：
- 完成任务数：
- 代码提交数：
- 会议参与数：
- 其他指标：

**遇到的问题/困难**：
【描述本周遇到的主要问题和挑战】

**下周工作计划**：
【列出下周计划完成的主要任务】

**需要的支持/资源**：
【需要团队或领导提供的支持】

请按以下结构整理成专业的周报：

---

## 📅 本周工作小结（【日期范围】）

### ✅ 已完成工作
1. 【任务1】
   - 具体成果
   - 关键数据

2. 【任务2】
   - 具体成果
   - 关键数据

### 📊 工作数据统计
| 指标 | 数值 | 备注 |
|------|------|------|
|      |      |      |

### 🚧 问题与风险
1. 【问题描述】
   - 影响分析
   - 解决方案建议

---

## 📋 下周工作计划

### 重点任务
1. 【任务1】
   - 预期目标
   - 时间节点

2. 【任务2】
   - 预期目标
   - 时间节点

### 需要支持
- 【支持事项1】
- 【支持事项2】

---

**本周自评**：【自我评价，例如：按计划完成、部分延期、超预期等】`,
    category: '工作',
    usageCount: 14350,
    isOfficial: true,
  },
  {
    id: 'market-interview-prep',
    title: '面试准备',
    description: '系统化面试准备模板，帮助梳理知识点和常见问题。',
    content: `请帮我准备【岗位名称】的面试。

**岗位信息**：
- 公司：【公司名称】
- 职位：【职位名称】
- 工作年限要求：【例如：3-5年】
- JD 核心要求：
  1. 【要求1】
  2. 【要求2】
  3. 【要求3】

**个人背景**：
- 相关工作经验：【描述】
- 掌握的技术栈：【列出】
- 项目经验：【简要描述】

**面试关注方向**（可多选）：
- [ ] 技术面试
- [ ] 项目介绍
- [ ] 行为面试
- [ ] 薪资谈判

请帮我：
1. 梳理该岗位常见的面试问题（技术+行为）
2. 准备标准回答框架
3. 帮我优化个人项目介绍
4. 提供面试技巧建议`,
    category: '学习',
    usageCount: 7890,
    isOfficial: true,
  },
  {
    id: 'market-travel-planner',
    title: '旅行规划',
    description: '智能旅行规划模板，帮助制定详细的出行计划。',
    content: `请帮我规划一次旅行。

**基本信息**：
- 出行目的地：【城市/国家】
- 出行时间：【开始日期】至【结束日期】，共【X】天
- 出行人数：【例如：2人（情侣）/ 3人（家庭）/ 多人（朋友）】
- 预算范围：【例如：人均5000元以内/ 人均10000元左右/ 预算充足】

**偏好信息**：
- 出行风格：【例如：轻松休闲 / 深度文化 / 冒险探索 / 美食之旅】
- 住宿偏好：【例如：经济型酒店 / 中端连锁 / 高端酒店 / 民宿】
- 必去景点：【列出】
- 必吃美食：【列出】
- 特别要求：【例如：带老人/带小孩/需要轮椅通行/素食等】

请帮我制定详细的旅行计划，包括：
1. 每日行程安排（含景点、交通、餐饮）
2. 推荐住宿区域和酒店
3. 交通方式建议（城际+市内）
4. 预算明细估算
5. 注意事项和必备物品清单`,
    category: '生活',
    usageCount: 6540,
    isOfficial: true,
  },
  {
    id: 'market-reading-notes',
    title: '读书笔记',
    description: '专业读书笔记模板，帮助深入理解书籍内容并输出高质量笔记。',
    content: `请帮我整理这本书的读书笔记。

**书籍信息**：
- 书名：【书名】
- 作者：【作者】
- 分类：【例如：文学/ 商业/ 技术/ 自我提升】
- 阅读进度：【例如：已读完 / 读到第X章】

**核心收获**（我自己的初步理解）：
【简要描述你从这本书中获得的主要收获，或者粘贴你在阅读过程中标记的关键段落】

**我想深入理解的问题**：
1. 【问题1】
2. 【问题2】

请帮我整理成结构化的读书笔记，包括：

1. **书籍概览**
   - 核心主题
   - 作者背景（如果相关）
   - 适合人群

2. **核心观点提炼**
   - 3-5个核心观点
   - 每个观点的具体解释和案例

3. **金句摘录**
   - 书中最有启发的句子

4. **我的思考**
   - 与我现有认知的碰撞
   - 可以应用到生活/工作中的地方

5. **行动计划**
   - 具体的行动步骤
   - 下一步要做什么`,
    category: '学习',
    usageCount: 5670,
    isOfficial: true,
  },
  {
    id: 'market-email-writer',
    title: '邮件写作',
    description: '专业商务邮件模板，适用于各种工作邮件场景。',
    content: `请帮我写一封【邮件类型】邮件。

**邮件基本信息**：
- 收件人：【例如：客户/ 领导/ 同事/ HR】
- 邮件目的：【例如：请求支持 / 汇报进展 / 提出问题 / 感谢 / 道歉】
- 收件人与我的关系：【例如：熟悉的客户 / 第一次接触 / 直属领导】

**邮件核心内容**：
【请描述邮件的主要内容，或粘贴相关的聊天记录/参考信息】

**特殊要求**：
- 语气要求：【例如：正式专业 / 友好亲切 / 紧急严肃】
- 字数要求：【例如：简洁明了 / 详细说明】
- 其他要求：【例如：需要抄送给XX / 需要确认回执等】

请帮我撰写邮件，并提供：
1. 邮件主题（2-3个备选）
2. 邮件正文
3. 签名建议

另外，请简要说明这个邮件的写作思路，为什么这样写。`,
    category: '工作',
    usageCount: 9120,
    isOfficial: true,
  },
];

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconTemplate(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconEdit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconStar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

interface TemplatePanelProps {
  visible: boolean;
  onClose: () => void;
  templates: TemplateItem[];
  onTemplateClick: (content: string) => void;
  onAddTemplate: (template: { title: string; content: string; category: string }) => Promise<void>;
  onUpdateTemplate: (id: string, template: { title?: string; content?: string; category?: string }) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

type FormModalMode = 'create' | 'edit' | 'save-as';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  initialValues?: {
    title: string;
    content: string;
    category?: string;
    id?: string;
  } | null;
  mode?: FormModalMode;
  onSubmit: (data: { title: string; content: string; category: string }) => Promise<void>;
}

export function FormModal({ visible, onClose, initialValues, mode, onSubmit }: FormModalProps) {
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('其他');
  const [saving, setSaving] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const effectiveMode: FormModalMode = useMemo(() => {
    if (mode) return mode;
    if (initialValues?.id) return 'edit';
    if (initialValues) return 'save-as';
    return 'create';
  }, [mode, initialValues]);

  const getModalTitle = () => {
    switch (effectiveMode) {
      case 'edit': return '编辑模板';
      case 'save-as': return '另存为模板';
      default: return '新建模板';
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        setFormTitle(initialValues.title);
        setFormContent(initialValues.content);
        setFormCategory(initialValues.category || '其他');
      } else {
        setFormTitle('');
        setFormContent('');
        setFormCategory('其他');
      }
    }
  }, [visible, initialValues]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [formTitle, formContent, formCategory, onSubmit, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="mx-4 w-full max-w-md flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconEdit className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">
              {getModalTitle()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#404040] transition-colors"
            aria-label="关闭"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                标题
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：帮我写个简历"
                className="w-full rounded-lg border border-black/[0.08] bg-[#fafafa] px-3.5 py-2.5 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                分类
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formCategory === cat
                        ? 'bg-[#171717] text-white shadow-sm'
                        : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5] border border-black/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                内容
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="输入模板内容，例如：请帮我写一份简历，要求突出工作经验..."
                rows={5}
                className="w-full resize-none rounded-lg border border-black/[0.08] bg-[#fafafa] px-3.5 py-2.5 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20 leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-end gap-2 border-t border-black/[0.06] bg-[#fafafa]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#525252] hover:bg-[#e5e5e5] transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formTitle.trim() || !formContent.trim() || saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#171717] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatePanel({
  visible,
  onClose,
  templates,
  onTemplateClick,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}: TemplatePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [activeFilter, setActiveFilter] = useState<string>('全部');
  const [marketActiveFilter, setMarketActiveFilter] = useState<string>('全部');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [copyingTemplateId, setCopyingTemplateId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const sorted = [...templates].sort((a, b) => a.orderIndex - b.orderIndex);
    if (activeFilter === '全部') {
      return sorted;
    }
    return sorted.filter((t) => t.category === activeFilter);
  }, [templates, activeFilter]);

  const filteredMarketTemplates = useMemo(() => {
    if (marketActiveFilter === '全部') {
      return MARKET_TEMPLATES;
    }
    return MARKET_TEMPLATES.filter((t) => t.category === marketActiveFilter);
  }, [marketActiveFilter]);

  const getMarketCategoryCount = (category: string) => {
    if (category === '全部') {
      return MARKET_TEMPLATES.length;
    }
    return MARKET_TEMPLATES.filter((t) => t.category === category).length;
  };

  const formatUsageCount = (count: number) => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'w';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const openEditForm = useCallback((template: TemplateItem) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  }, []);

  const openAddForm = useCallback(() => {
    setEditingTemplate(null);
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setEditingTemplate(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: { title: string; content: string; category: string }) => {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, data);
      } else {
        await onAddTemplate(data);
      }
    },
    [editingTemplate, onAddTemplate, onUpdateTemplate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('确定要删除这个模板吗？')) {
        await onDeleteTemplate(id);
      }
    },
    [onDeleteTemplate]
  );

  const handleUseMarketTemplate = useCallback(
    async (template: MarketTemplateItem) => {
      setCopyingTemplateId(template.id);
      try {
        await onAddTemplate({
          title: template.title,
          content: template.content,
          category: template.category,
        });
        setActiveTab('my');
        setExpandedTemplateId(null);
      } finally {
        setCopyingTemplateId(null);
      }
    },
    [onAddTemplate]
  );

  const toggleTemplateExpand = useCallback((templateId: string) => {
    setExpandedTemplateId((prev) => (prev === templateId ? null : templateId));
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '工作':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case '学习':
        return 'bg-green-50 text-green-700 border-green-100';
      case '生活':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  useEffect(() => {
    if (!visible) {
      setShowFormModal(false);
      setEditingTemplate(null);
      setActiveFilter('全部');
      setMarketActiveFilter('全部');
      setExpandedTemplateId(null);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
            }
            to {
              opacity: 1;
              max-height: 500px;
            }
          }
          @keyframes slideUp {
            from {
              opacity: 1;
              max-height: 500px;
            }
            to {
              opacity: 0;
              max-height: 0;
            }
          }
          .template-detail-enter {
            animation: slideDown 0.25s ease-out forwards;
          }
          .template-detail-exit {
            animation: slideUp 0.2s ease-in forwards;
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconTemplate className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">
              {activeTab === 'my' ? '我的模板' : '模板市场'}
            </span>
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#e5e5e5] text-[#525252]">
              {activeTab === 'my' ? templates.length : MARKET_TEMPLATES.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {activeTab === 'my' && (
              <button
                type="button"
                onClick={openAddForm}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
              >
                <IconPlus className="h-4 w-4" />
                新建模板
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-[#737373] hover:text-[#404040] transition-colors ml-1"
              aria-label="关闭"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-black/[0.06] bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('my')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'my'
                ? 'text-[#171717] border-b-2 border-[#171717] bg-white'
                : 'text-[#737373] hover:text-[#404040] border-b-2 border-transparent bg-[#fafafa]'
            }`}
          >
            我的模板
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('market')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'market'
                ? 'text-[#171717] border-b-2 border-[#171717] bg-white'
                : 'text-[#737373] hover:text-[#404040] border-b-2 border-transparent bg-[#fafafa]'
            }`}
          >
            <IconStar className="h-4 w-4" />
            模板市场
          </button>
        </div>

        {activeTab === 'my' && (
          <>
            <div className="px-4 py-3 border-b border-black/[0.04] bg-white">
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((cat) => {
                  const count = cat === '全部'
                    ? templates.length
                    : templates.filter((t) => t.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveFilter(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeFilter === cat
                          ? 'bg-[#171717] text-white shadow-sm'
                          : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5] border border-black/[0.06]'
                      }`}
                    >
                      {cat}
                      <span className={`text-xs ${
                        activeFilter === cat ? 'text-white/70' : 'text-[#a3a3a3]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <IconTemplate className="h-14 w-14 text-[#d4d4d4] mb-3" />
                  <p className="text-sm font-medium text-[#737373] mb-1">暂无模板</p>
                  <p className="text-xs text-[#a3a3a3] mb-5 text-center leading-relaxed">
                    {activeFilter === '全部'
                      ? '可以点击下方"创建模板"按钮新建\n或从模板市场一键导入优质模板'
                      : `"${activeFilter}"分类下暂无模板，切换其他分类或新建模板`}
                  </p>
                  {activeFilter === '全部' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={openAddForm}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
                      >
                        <IconPlus className="h-4 w-4" />
                        创建模板
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('market')}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-[#171717] bg-[#fafafa] hover:bg-[#f5f5f5] border border-black/[0.08] transition-colors"
                      >
                        <IconStar className="h-4 w-4" />
                        去市场
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="group flex items-stretch gap-0 overflow-hidden rounded-xl border border-black/[0.06] bg-white transition-all hover:border-black/[0.12] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onTemplateClick(template.content);
                          onClose();
                        }}
                        className="min-w-0 flex-1 flex flex-col items-start gap-2 rounded-l-xl px-4 py-3 text-left transition-colors hover:bg-[#fafafa]"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-sm font-semibold text-[#171717] truncate">
                            {template.title}
                          </span>
                          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md border ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#525252] leading-relaxed line-clamp-2">
                          {template.content}
                        </p>
                      </button>
                      <div className="flex items-center gap-0.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEditForm(template)}
                          className="flex w-9 h-9 items-center justify-center text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717] rounded-lg transition-colors"
                          title="编辑模板"
                          aria-label="编辑"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(template.id)}
                          className="flex w-9 h-9 items-center justify-center text-[#737373] hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="删除模板"
                          aria-label="删除"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'market' && (
          <>
            <div className="px-4 py-3 border-b border-black/[0.04] bg-white">
              <div className="flex flex-wrap gap-1.5">
                {MARKET_CATEGORIES.map((cat) => {
                  const count = getMarketCategoryCount(cat);

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMarketActiveFilter(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        marketActiveFilter === cat
                          ? 'bg-[#171717] text-white shadow-sm'
                          : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5] border border-black/[0.06]'
                      }`}
                    >
                      {cat}
                      <span className={`text-xs ${
                        marketActiveFilter === cat ? 'text-white/70' : 'text-[#a3a3a3]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredMarketTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <IconStar className="h-14 w-14 text-[#d4d4d4] mb-3" />
                  <p className="text-sm font-medium text-[#737373] mb-1">暂无模板</p>
                  <p className="text-xs text-[#a3a3a3] text-center leading-relaxed">
                    该分类下暂无模板，切换其他分类查看
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredMarketTemplates.map((template) => {
                    const isExpanded = expandedTemplateId === template.id;
                    const isCopying = copyingTemplateId === template.id;

                    return (
                      <div
                        key={template.id}
                        className={`flex flex-col overflow-hidden rounded-xl border transition-all ${
                          isExpanded
                            ? 'border-[#171717]/[0.2] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)]'
                            : 'border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]'
                        } bg-white`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTemplateExpand(template.id)}
                          className="w-full flex flex-col items-start gap-2 px-4 py-3 text-left transition-colors hover:bg-[#fafafa]/50"
                        >
                          <div className="flex items-start justify-between w-full gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-[#171717]">
                                  {template.title}
                                </span>
                                {template.isOfficial && (
                                  <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                                    官方
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#525252] leading-relaxed">
                                {template.description}
                              </p>
                            </div>
                            <IconChevronDown
                              className={`h-5 w-5 text-[#737373] shrink-0 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md border ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-[#a3a3a3]">
                              <IconUsers className="h-3.5 w-3.5" />
                              {formatUsageCount(template.usageCount)} 人使用
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="template-detail-enter overflow-hidden">
                            <div className="px-4 pb-3">
                              <div className="bg-[#fafafa] rounded-lg p-3 border border-black/[0.04] mb-3">
                                <p className="text-xs font-medium text-[#525252] mb-2">模板内容预览</p>
                                <pre className="text-xs text-[#171717] leading-relaxed whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                                  {template.content}
                                </pre>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUseMarketTemplate(template)}
                                  disabled={isCopying}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-[#171717] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                  {isCopying ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      导入中...
                                    </>
                                  ) : (
                                    <>
                                      <IconPlus className="h-4 w-4" />
                                      一键使用
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <FormModal
        visible={showFormModal}
        onClose={closeFormModal}
        initialValues={editingTemplate ? {
          id: editingTemplate.id,
          title: editingTemplate.title,
          content: editingTemplate.content,
          category: editingTemplate.category,
        } : null}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
