/**
 * Tool Executors — Handle actual tool execution
 *
 * Each executor takes arguments and returns a result string.
 */

// ─── 1. Web Search (using DuckDuckGo Instant Answer API — no key needed) ───

async function execWebSearch(args: { query: string; count?: number }): Promise<string> {
  const { query, count = 5 } = args;

  try {
    // Use DuckDuckGo Instant Answer API (free, no API key)
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    const data = await res.json();

    const results: string[] = [];

    // Abstract text
    if (data.AbstractText) {
      results.push(`📖 ${data.AbstractText}`);
      if (data.AbstractURL) results.push(`🔗 ${data.AbstractURL}`);
    }

    // Related topics
    if (data.RelatedTopics?.length > 0) {
      const topics = data.RelatedTopics.slice(0, count);
      topics.forEach((t: any, i: number) => {
        if (t.Text) results.push(`${i + 1}. ${t.Text}`);
        if (t.FirstURL) results.push(`   🔗 ${t.FirstURL}`);
      });
    }

    if (results.length === 0) {
      return JSON.stringify({
        success: false,
        message: `未找到关于"${query}"的搜索结果。建议尝试更具体的关键词。`,
      });
    }

    return JSON.stringify({
      success: true,
      query,
      results: results.join('\n'),
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }
}

// ─── 2. Code Execution (sandboxed Python-like evaluation) ───────────────────

async function execCodeExecution(args: { code: string; timeout?: number }): Promise<string> {
  const { code, timeout = 10 } = args;

  try {
    // We'll use a lightweight approach: evaluate safe expressions
    // For full Python execution, integrate with Pyodide or a backend service
    const result = evaluateSafeCode(code);
    return JSON.stringify({
      success: true,
      code: code.slice(0, 200) + (code.length > 200 ? '...' : ''),
      output: result,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    });
  }
}

function evaluateSafeCode(code: string): string {
  // Safe evaluation for math expressions
  const lines = code.split('\n').filter((l) => l.trim());
  const outputs: string[] = [];

  for (const line of lines) {
    // Handle print statements
    const printMatch = line.match(/^print\((.+)\)$/);
    if (printMatch) {
      try {
        const val = safeEval(printMatch[1]);
        outputs.push(String(val));
      } catch {
        outputs.push(`[print] ${printMatch[1]}`);
      }
      continue;
    }

    // Handle assignments
    const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch) {
      try {
        const val = safeEval(assignMatch[2]);
        outputs.push(`${assignMatch[1]} = ${val}`);
      } catch {
        outputs.push(`[assigned] ${assignMatch[1]}`);
      }
      continue;
    }

    // Try evaluating as expression
    try {
      const val = safeEval(line);
      outputs.push(String(val));
    } catch {
      outputs.push(`[executed] ${line}`);
    }
  }

  return outputs.join('\n') || '代码执行完成（无输出）';
}

function safeEval(expr: string): unknown {
  // Remove dangerous patterns
  if (/import|require|process|exec|eval|Function|fetch|http/i.test(expr)) {
    throw new Error('不安全的操作被阻止');
  }

  // Math functions
  const mathFns: Record<string, (...args: number[]) => number> = {
    sqrt: Math.sqrt,
    abs: Math.abs,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    pow: Math.pow,
    log: Math.log,
    log10: Math.log10,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    max: Math.max,
    min: Math.min,
  };

  const mathConsts: Record<string, number> = {
    pi: Math.PI,
    e: Math.E,
    PI: Math.PI,
    E: Math.E,
  };

  // Build safe context
  const ctx: Record<string, unknown> = { ...mathConsts };

  // Replace math function calls
  let safeExpr = expr;
  for (const [name, fn] of Object.entries(mathFns)) {
    ctx[name] = fn;
  }

  // Replace constants
  for (const [name, val] of Object.entries(mathConsts)) {
    safeExpr = safeExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), String(val));
  }

  // Replace ^ with **
  safeExpr = safeExpr.replace(/\^/g, '**');

  try {
    const fn = new Function(...Object.keys(ctx), `return (${safeExpr})`);
    return fn(...Object.values(ctx));
  } catch {
    throw new Error(`无法计算表达式: ${expr}`);
  }
}

// ─── 3. Calculator ──────────────────────────────────────────────────────────

async function execCalculator(args: { expression: string }): Promise<string> {
  const { expression } = args;
  try {
    const result = safeEval(expression);
    return JSON.stringify({
      success: true,
      expression,
      result: typeof result === 'number' ? Number((result as number).toFixed(10)) : result,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: `计算失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }
}

// ─── 4. Text Analyzer ───────────────────────────────────────────────────────

async function execTextAnalyzer(args: { text: string; analysis_type: string }): Promise<string> {
  const { text, analysis_type } = args;

  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.split(/[.!?。！？]+/).filter(Boolean).length;
  const avgWordLength = wordCount > 0 ? (text.replace(/\s/g, '').length / wordCount).toFixed(1) : '0';

  // Extract keywords (simple TF approach)
  const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them', 'his', 'her', 'their', 'my', 'your', 'our', 'we']);

  const words = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  const freq: Record<string, number> = {};
  words.forEach(w => {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => `${word}(${count})`);

  // Simple sentiment analysis (keyword-based)
  const positiveWords = ['好', '棒', '优秀', '喜欢', '开心', '成功', 'great', 'good', 'excellent', 'amazing', 'love', 'happy', 'wonderful', 'fantastic', 'best'];
  const negativeWords = ['差', '坏', '糟糕', '失望', '失败', '困难', 'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'poor', 'sad', 'angry'];

  const lowerText = text.toLowerCase();
  const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const sentiment = posCount > negCount ? '正面 👍' : negCount > posCount ? '负面 👎' : '中性 😐';

  // Readability (simple avg sentence length)
  const avgSentLen = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : '0';
  const readability = parseFloat(avgSentLen) < 15 ? '易读 📗' : parseFloat(avgSentLen) < 25 ? '中等 📙' : '较难 📕';

  // Generate summary (first 2-3 sentences)
  const sentences = text.split(/[.!?。！？]+/).filter(Boolean);
  const summary = sentences.slice(0, 3).join('。') + (sentences.length > 3 ? '。' : '');

  const analysis: Record<string, unknown> = {};

  if (analysis_type === 'summary' || analysis_type === 'all') {
    analysis.summary = summary || '文本太短，无法生成摘要';
  }
  if (analysis_type === 'keywords' || analysis_type === 'all') {
    analysis.keywords = keywords;
  }
  if (analysis_type === 'sentiment' || analysis_type === 'all') {
    analysis.sentiment = sentiment;
    analysis.positiveScore = posCount;
    analysis.negativeScore = negCount;
  }
  if (analysis_type === 'readability' || analysis_type === 'all') {
    analysis.readability = readability;
    analysis.stats = { charCount, wordCount, sentenceCount, avgWordLength, avgSentLen };
  }

  return JSON.stringify({ success: true, analysis_type, ...analysis }, null, 2);
}

// ─── 5. Translator ──────────────────────────────────────────────────────────

async function execTranslator(args: { text: string; target_lang?: string; style?: string }): Promise<string> {
  const { text, target_lang = 'en', style = 'formal' } = args;

  // Language detection (simple heuristic)
  const langMap: Record<string, RegExp> = {
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af\u1100-\u11ff]/,
    en: /[a-zA-Z]/,
    fr: /[àâçéèêëîïôûùüÿœæ]/i,
    de: /[äöüß]/i,
    es: /[áéíóúñ¿¡]/i,
  };

  let detectedLang = 'unknown';
  let maxScore = 0;
  for (const [lang, regex] of Object.entries(langMap)) {
    const matches = text.match(new RegExp(regex.source, 'g'));
    const score = matches ? matches.length / text.length : 0;
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  const langNames: Record<string, string> = {
    zh: '中文', en: '英语', ja: '日语', ko: '韩语', fr: '法语', de: '德语', es: '西班牙语',
  };

  // For actual translation, the AI model handles it
  // This tool returns metadata + instructs the model to translate
  return JSON.stringify({
    success: true,
    detected_language: langNames[detectedLang] || detectedLang,
    target_language: langNames[target_lang] || target_lang,
    style,
    text_length: text.length,
    instruction: `请将以下文本从${langNames[detectedLang] || detectedLang}翻译为${langNames[target_lang] || target_lang}（${style}风格）`,
    original_text: text.slice(0, 500),
  });
}

// ─── Executor Registry ───────────────────────────────────────────────────────

type ExecutorFn = (args: Record<string, unknown>) => Promise<string>;

const EXECUTORS: Record<string, ExecutorFn> = {
  web_search: execWebSearch as ExecutorFn,
  code_execution: execCodeExecution as ExecutorFn,
  calculator: execCalculator as ExecutorFn,
  text_analyzer: execTextAnalyzer as ExecutorFn,
  translator: execTranslator as ExecutorFn,
};

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const executor = EXECUTORS[name];
  if (!executor) {
    return JSON.stringify({ success: false, error: `未知工具: ${name}` });
  }
  return executor(args);
}
