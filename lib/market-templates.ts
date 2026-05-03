import { prisma } from '@/lib/db';
import type { MarketTemplate } from '@prisma/client';

export type {
  getMarketTemplates,
  getMarketTemplateById,
  getMarketTemplateBySlug,
  useMarketTemplate,
  getMarketTemplateCategories,
  syncUsageCount,
  incrementUsageCount,
};

const MARKET_CATEGORIES = ['工作', '学习', '生活', '其他'];

async function getMarketTemplates(options?: {
  category?: string;
  includeInactive?: boolean;
}) {
  const { category, includeInactive = false } = options ?? {};

  const where: Record<string, unknown> = {
    isActive: includeInactive ? undefined : true,
  };

  if (category && category !== '全部' && MARKET_CATEGORIES.includes(category)) {
    where.category = category;
  }

  const templates = await prisma.marketTemplate.findMany({
    where,
    orderBy: [
      { sortOrder: 'asc' },
      { usageCount: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return templates;
}

async function getMarketTemplateById(id: string, includeInactive?: boolean) {
  const template = await prisma.marketTemplate.findFirst({
    where: {
      id,
      isActive: includeInactive ? undefined : true,
    },
  });

  return template;
}

async function getMarketTemplateBySlug(slug: string, includeInactive?: boolean) {
  const template = await prisma.marketTemplate.findFirst({
    where: {
      slug,
      isActive: includeInactive ? undefined : true,
    },
  });

  return template;
}

async function getMarketTemplateCategories() {
  const result = await prisma.marketTemplate.groupBy({
    by: ['category'],
    _count: {
      id: true },
    where: {
      isActive: true,
    },
  });

  const categoryCounts: Record<string, number> = {};

  let total = 0;
  result.forEach((item) => {
    categoryCounts[item.category] = item._count.id;
    total += item._count.id;
  });

  const allCategories = [
    { category: '全部', count: total },
    ...MARKET_CATEGORIES
      .filter((cat) => categoryCounts[cat] !== undefined || categoryCounts[cat] > 0)
      .map((cat) => ({
        category: cat,
        count: categoryCounts[cat] || 0,
      })),
  ];

  return allCategories;
}

async function useMarketTemplate(options: {
  marketTemplateId: string;
  userId: string;
  deviceId: string;
}) {
  const { marketTemplateId, userId, deviceId } = options;

  return await prisma.$transaction(async (tx) => {
    const marketTemplate = await tx.marketTemplate.findUnique({
      where: { id: marketTemplateId },
    });

    if (!marketTemplate || !marketTemplate.isActive) {
        throw new Error('模板不存在或已下架');
    }

    const maxOrderIndex = await tx.template.findFirst({
      where: { userId, deviceId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    const newOrderIndex = (maxOrderIndex?.orderIndex ?? -1) + 1;

    const userTemplate = await tx.template.create({
      data: {
        userId,
        deviceId,
        title: marketTemplate.title,
        content: marketTemplate.content,
        category: marketTemplate.category,
        orderIndex: newOrderIndex,
        importedFromMarketTemplateId: marketTemplate.id,
      },
    });

    const existingUsage = await tx.marketTemplateUsage.findUnique({
      where: {
        marketTemplateId_userId_deviceId: {
          marketTemplateId,
          userId,
          deviceId,
        },
      },
    });

    if (!existingUsage) {
      await tx.marketTemplateUsage.create({
        data: {
          marketTemplateId,
          userId,
          deviceId,
          importedTemplateId: userTemplate.id,
        },
      });

      await tx.marketTemplate.update({
        where: { id: marketTemplateId },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }

    return {
      userTemplateId: userTemplate.id,
      marketTemplate,
      isFirstUse: !existingUsage,
    };
  });
}

async function incrementUsageCount(marketTemplateId: string) {
  return prisma.marketTemplate.update({
    where: { id: marketTemplateId },
    data: {
      usageCount: { increment: 1 },
    },
  });
}

async function syncUsageCount(marketTemplateId: string) {
  const usageCount = await prisma.marketTemplateUsage.count({
    where: { marketTemplateId },
  });

  return prisma.marketTemplate.update({
    where: { id: marketTemplateId },
    data: { usageCount },
  });
}

export const DEFAULT_MARKET_TEMPLATES: Omit<
  MarketTemplate,
  'id' | 'createdAt' | 'updatedAt'
>[] = [
  {
    slug: 'translation-helper',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 1,
    tags: ['翻译', '多语言', '专业翻译'],
    meta: null,
  },
  {
    slug: 'code-review',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 2,
    tags: ['代码审查', 'Code Review', '代码质量'],
    meta: null,
  },
  {
    slug: 'copywriting',
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
- 文案风格：【例如：专业正式/轻松活泼/文艺清新清新清新】
- 字数要求：【例如：100字以内/300字左右/500字以上】
- 特殊要求：【其他要求】

请提供多个版本供选择，并说明每个版本的特点。`,
    category: '工作',
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 3,
    tags: ['文案', '营销', '推广'],
    meta: null,
  },
  {
    slug: 'study-plan',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 4,
    tags: ['学习计划', '学习规划', '效率'],
    meta: null,
  },
  {
    slug: 'meeting-minutes',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 5,
    tags: ['会议', '纪要', '记录'],
    meta: null,
  },
  {
    slug: 'weekly-report',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 6,
    tags: ['周报', '工作总结', '汇报'],
    meta: null,
  },
  {
    slug: 'interview-prep',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 7,
    tags: ['面试', '求职', '面试准备'],
    meta: null,
  },
  {
    slug: 'travel-planner',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 8,
    tags: ['旅行', '规划', '出行'],
    meta: null,
  },
  {
    slug: 'reading-notes',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 9,
    tags: ['读书', '笔记', '阅读'],
    meta: null,
  },
  {
    slug: 'email-writer',
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
    isOfficial: true,
    isActive: true,
    usageCount: 0,
    sortOrder: 10,
    tags: ['邮件', '商务', '沟通'],
    meta: null,
  },
];
