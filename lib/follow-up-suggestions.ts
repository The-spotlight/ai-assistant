/**
 * 推荐追问生成器
 * 根据 AI 回复内容动态生成相关的推荐追问
 */

/**
 * 检测回复中是否包含编号列表（如 1.、2.、3. 或 - 等）
 */
function hasNumberedList(content: string): boolean {
  return /^\s*\d+\.\s/m.test(content) || /^\s*[-*+]\s/m.test(content);
}

/**
 * 检测回复中是否包含代码块
 */
function hasCodeBlock(content: string): boolean {
  return content.includes('```');
}

/**
 * 检测回复中是否包含表格
 */
function hasTable(content: string): boolean {
  return /^\s*\|.*\|\s*$/m.test(content);
}

/**
 * 检测回复长度，判断是否是详细解释
 */
function isLongExplanation(content: string): boolean {
  return content.length > 500;
}

/**
 * 检测回复中是否包含数学公式或计算
 */
function hasMathContent(content: string): boolean {
  // 使用 [\s\S] 匹配任何字符（包括换行符），替代 ES2018 的 s 标志
  return /\$\$[\s\S]*?\$\$/.test(content) || /\$[\s\S]*?\$/.test(content) || /[+\-*/=]/.test(content);
}

/**
 * 检测回复中是否包含技术术语或专业概念
 */
function hasTechnicalTerms(content: string): boolean {
  const technicalKeywords = [
    'API', 'SDK', '框架', '库', '组件', '模块', '接口', '协议',
    '算法', '数据结构', '数据库', '缓存', '队列', '线程', '进程',
    '并发', '异步', '同步', '事务', '锁', '索引', '优化', '重构',
    '部署', '运维', '监控', '日志', '安全', '加密', '认证', '授权',
    'function', 'class', 'interface', 'method', 'variable', 'constant',
    'import', 'export', 'require', 'async', 'await', 'promise', 'callback',
  ];
  
  return technicalKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 生成推荐追问
 * @param content AI 回复内容
 * @param userMessage 用户的原始问题（可选，用于生成更相关的追问）
 * @returns 2-3 个推荐追问选项
 */
export function generateFollowUpSuggestions(
  content: string,
  userMessage?: string
): string[] {
  const suggestions: string[] = [];
  
  // 基于内容特征生成推荐追问
  const features = {
    hasNumberedList: hasNumberedList(content),
    hasCodeBlock: hasCodeBlock(content),
    hasTable: hasTable(content),
    isLongExplanation: isLongExplanation(content),
    hasMathContent: hasMathContent(content),
    hasTechnicalTerms: hasTechnicalTerms(content),
  };

  // 1. 针对编号列表的推荐追问
  if (features.hasNumberedList) {
    // 提取列表项数量
    const listItems = content.match(/^\s*(\d+)\.\s/gm);
    if (listItems && listItems.length >= 2) {
      // 随机选择一个点来详细解释
      const randomPoint = Math.floor(Math.random() * listItems.length) + 1;
      suggestions.push(`详细解释第 ${randomPoint} 点`);
    }
    suggestions.push('请举个实际应用的例子');
  }

  // 2. 针对代码块的推荐追问
  if (features.hasCodeBlock) {
    suggestions.push('给我一个更复杂的例子');
    suggestions.push('如何优化这段代码');
    suggestions.push('这段代码的工作原理是什么');
  }

  // 3. 针对表格的推荐追问
  if (features.hasTable) {
    suggestions.push('请解释表格中的数据');
    suggestions.push('这个表格可以用来做什么');
  }

  // 4. 针对长解释的推荐追问
  if (features.isLongExplanation) {
    if (!suggestions.some(s => s.includes('总结'))) {
      suggestions.push('用更简单的语言总结一下');
    }
  }

  // 5. 针对数学内容的推荐追问
  if (features.hasMathContent && !features.hasCodeBlock) {
    suggestions.push('请详细解释这个计算过程');
    suggestions.push('给我一个具体的数值例子');
  }

  // 6. 针对技术术语的推荐追问
  if (features.hasTechnicalTerms) {
    const techSuggestions = [
      '这些技术术语是什么意思',
      '适合什么场景使用',
      '有什么优缺点',
      '和其他类似技术有什么区别',
    ];
    const randomTech = techSuggestions[Math.floor(Math.random() * techSuggestions.length)];
    if (!suggestions.includes(randomTech)) {
      suggestions.push(randomTech);
    }
  }

  // 7. 通用推荐追问（作为保底）
  const generalSuggestions = [
    '给我一个具体的例子',
    '详细解释一下',
    '还有其他方法吗',
    '如何实际应用',
    '需要注意什么',
    '能再深入一点吗',
    '用更简单的方式说明',
    '有什么常见的误区',
  ];

  // 确保至少有 2-3 个推荐追问
  const neededCount = Math.max(0, 2 - suggestions.length);
  if (neededCount > 0) {
    // 随机添加通用推荐追问
    const shuffledGeneral = [...generalSuggestions]
      .filter(s => !suggestions.includes(s))
      .sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < neededCount && i < shuffledGeneral.length; i++) {
      suggestions.push(shuffledGeneral[i]);
    }
  }

  // 如果超过 3 个，随机选择 3 个
  if (suggestions.length > 3) {
    const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  return suggestions;
}

/**
 * 检查是否应该显示推荐追问
 * 对于非常短的回复（如简单的确认、问候等），可能不需要显示推荐追问
 */
export function shouldShowFollowUpSuggestions(content: string): boolean {
  // 太短的回复不显示
  if (content.trim().length < 50) {
    return false;
  }
  
  // 简单的确认性回复不显示
  const simpleResponses = [
    '好的', '没问题', '可以', '是的', '对', '没错',
    '明白了', '了解了', '知道了', '好的，我明白了',
    '好的，没问题', '当然可以', '没问题的',
  ];
  
  const lowerContent = content.trim().toLowerCase();
  const isSimpleResponse = simpleResponses.some(response => 
    lowerContent === response.toLowerCase() || 
    lowerContent.startsWith(response.toLowerCase() + '，') ||
    lowerContent.startsWith(response.toLowerCase() + '。')
  );
  
  if (isSimpleResponse && content.trim().length < 100) {
    return false;
  }
  
  return true;
}
