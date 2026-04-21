import { tool } from 'ai';
import { z } from 'zod';
import { executeTool } from './executor';

/**
 * AI SDK 要求 tools 使用 `tool()`，且 `parameters` 为 Zod（或 `jsonSchema()`），
 * 不能直接把 OpenAI 风格的 JSON Schema 对象当作 parameters 传入。
 */
export const chatTools = {
  web_search: tool({
    description:
      '搜索互联网获取实时信息。当用户询问时效性问题、新闻、天气、最新事件时使用此工具。',
    parameters: z.object({
      query: z.string().describe('搜索关键词或问题'),
      count: z.number().optional().describe('返回结果数量，默认5条'),
    }),
    execute: async (args) => executeTool('web_search', args as Record<string, unknown>),
  }),
  code_execution: tool({
    description: '执行 Python 代码并返回结果。用于数学计算、数据处理、算法验证等。',
    parameters: z.object({
      code: z.string().describe('要执行的 Python 代码'),
      timeout: z.number().optional().describe('超时时间（秒），默认10秒'),
    }),
    execute: async (args) => executeTool('code_execution', args as Record<string, unknown>),
  }),
  calculator: tool({
    description: '执行精确数学计算。当需要精确数值结果时使用。',
    parameters: z.object({
      expression: z.string().describe('数学表达式，如 "2**10 + sqrt(144)"'),
    }),
    execute: async (args) => executeTool('calculator', args as Record<string, unknown>),
  }),
  text_analyzer: tool({
    description: '分析文本：摘要、关键词、情感、可读性等。',
    parameters: z.object({
      text: z.string().describe('要分析的文本内容'),
      analysis_type: z
        .enum(['summary', 'keywords', 'sentiment', 'readability', 'all'])
        .describe('分析类型'),
    }),
    execute: async (args) => executeTool('text_analyzer', args as Record<string, unknown>),
  }),
  translator: tool({
    description: '翻译辅助：返回语言检测与目标语言等元信息，由模型完成最终译文表述。',
    parameters: z.object({
      text: z.string().describe('要翻译的文本'),
      target_lang: z.enum(['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'auto']).optional(),
      style: z.enum(['formal', 'casual', 'technical', 'literary']).optional(),
    }),
    execute: async (args) => executeTool('translator', args as Record<string, unknown>),
  }),
  weather: tool({
    description:
      '查询实时天气和天气预报。当用户询问天气、气温、降水、风向、紫外线指数等气象信息时使用此工具。支持城市名称查询和经纬度坐标查询。',
    parameters: z.object({
      location: z.string().optional().describe('城市名称或地址，如 "北京"、"上海市浦东新区"、"New York"'),
      latitude: z.number().optional().describe('纬度坐标（可选，与 location 二选一）'),
      longitude: z.number().optional().describe('经度坐标（可选，与 location 二选一）'),
      forecast_days: z.number().optional().describe('预报天数，默认3天，最多7天'),
    }),
    execute: async (args) => executeTool('weather', args as Record<string, unknown>),
  }),
};
