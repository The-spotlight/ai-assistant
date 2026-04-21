/**
 * Tool Definitions — Function Calling Skills
 *
 * Each tool is a structured skill the AI can invoke.
 * Schema follows OpenAI function calling format.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// ─── 1. Web Search ───────────────────────────────────────────────────────────

export const webSearchTool: ToolDefinition = {
  name: 'web_search',
  description: '搜索互联网获取实时信息。当用户询问时效性问题、新闻、天气、最新事件时使用此工具。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词或问题',
      },
      count: {
        type: 'number',
        description: '返回结果数量，默认5条',
      },
    },
    required: ['query'],
  },
};

// ─── 2. Code Execution ──────────────────────────────────────────────────────

export const codeExecutionTool: ToolDefinition = {
  name: 'code_execution',
  description: '执行 Python 代码并返回结果。用于数学计算、数据处理、图表生成、算法验证等。代码在沙箱中运行。',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: '要执行的 Python 代码',
      },
      timeout: {
        type: 'number',
        description: '超时时间（秒），默认10秒',
      },
    },
    required: ['code'],
  },
};

// ─── 3. Calculator ───────────────────────────────────────────────────────────

export const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: '执行精确数学计算。支持基本运算、三角函数、对数、微积分等。当需要精确数值结果时使用。',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式，如 "2**10 + sqrt(144)" 或 "sin(pi/4)"',
      },
    },
    required: ['expression'],
  },
};

// ─── 4. Text Analyzer ───────────────────────────────────────────────────────

export const textAnalyzerTool: ToolDefinition = {
  name: 'text_analyzer',
  description: '分析文本内容：提取摘要、关键词、情感分析、字数统计、可读性评分。',
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '要分析的文本内容',
      },
      analysis_type: {
        type: 'string',
        description: '分析类型',
        enum: ['summary', 'keywords', 'sentiment', 'readability', 'all'],
      },
    },
    required: ['text', 'analysis_type'],
  },
};

// ─── 5. Translator ──────────────────────────────────────────────────────────

export const translatorTool: ToolDefinition = {
  name: 'translator',
  description: '智能翻译文本。自动检测源语言，支持中/英/日/韩/法/德/西等语言互译。',
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '要翻译的文本',
      },
      target_lang: {
        type: 'string',
        description: '目标语言代码',
        enum: ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'auto'],
      },
      style: {
        type: 'string',
        description: '翻译风格',
        enum: ['formal', 'casual', 'technical', 'literary'],
      },
    },
    required: ['text'],
  },
};

// ─── 6. Weather ───────────────────────────────────────────────────────────

export const weatherTool: ToolDefinition = {
  name: 'weather',
  description: '查询实时天气和天气预报。当用户询问天气、气温、降水、风向等气象信息时使用此工具。支持城市名称查询和经纬度坐标查询。',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: '城市名称或地址，如 "北京"、"上海市浦东新区"、"New York"',
      },
      latitude: {
        type: 'number',
        description: '纬度坐标（可选，与 location 二选一）',
      },
      longitude: {
        type: 'number',
        description: '经度坐标（可选，与 location 二选一）',
      },
      forecast_days: {
        type: 'number',
        description: '预报天数，默认3天，最多7天',
      },
    },
    required: [],
  },
};

// ─── Tool Registry ───────────────────────────────────────────────────────────

export const ALL_TOOLS: ToolDefinition[] = [
  webSearchTool,
  codeExecutionTool,
  calculatorTool,
  textAnalyzerTool,
  translatorTool,
  weatherTool,
];

// Convert to OpenAI function calling format
export function getToolSchemas() {
  return ALL_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
