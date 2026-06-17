/** 模型定价表（每 1M tokens 的美元价格） */
export interface ModelPricing {
  /** 输入 token 价格（每百万） */
  input: number;
  /** 输出 token 价格（每百万） */
  output: number;
  /** 模型显示名称 */
  label: string;
}

/** 常见模型定价表（基于 OpenRouter 常见模型价格） */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT 系列
  'openai/gpt-4o': { input: 2.5, output: 10, label: 'GPT-4o' },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6, label: 'GPT-4o Mini' },
  'openai/gpt-4-turbo': { input: 10, output: 30, label: 'GPT-4 Turbo' },
  'openai/gpt-3.5-turbo-0125': { input: 0.5, output: 1.5, label: 'GPT-3.5 Turbo' },

  // Claude 系列
  'anthropic/claude-3-5-sonnet-20241022': { input: 3, output: 15, label: 'Claude 3.5 Sonnet' },
  'anthropic/claude-3-5-haiku-20241022': { input: 0.8, output: 4, label: 'Claude 3.5 Haiku' },
  'anthropic/claude-3-opus-20240229': { input: 15, output: 75, label: 'Claude 3 Opus' },

  // Llama 系列
  'meta-llama/llama-3.2-3b-instruct:free': { input: 0, output: 0, label: 'Llama 3.2 3B（免费）' },
  'meta-llama/llama-3.1-8b-instruct': { input: 0.18, output: 0.18, label: 'Llama 3.1 8B' },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.88, output: 0.88, label: 'Llama 3.1 70B' },

  // Mistral 系列
  'mistralai/mistral-7b-instruct:free': { input: 0, output: 0, label: 'Mistral 7B（免费）' },
  'mistralai/mistral-small-2409': { input: 0.2, output: 0.6, label: 'Mistral Small' },
  'mistralai/mistral-large-2411': { input: 2, output: 6, label: 'Mistral Large' },

  // Gemma 系列
  'google/gemma-2-9b-it:free': { input: 0, output: 0, label: 'Gemma 2 9B（免费）' },
  'google/gemma-4-26b-a4b-it:free': { input: 0, output: 0, label: 'Gemma 4 26B（免费）' },

  // OpenRouter 免费路由
  'openrouter/free': { input: 0, output: 0, label: 'OpenRouter 免费路由' },

  // Elephant Alpha（项目默认）
  'openrouter/elephant-alpha': { input: 0.5, output: 1.5, label: 'Elephant Alpha' },
};

/** 默认定价（当模型不在定价表中时使用） */
export const DEFAULT_PRICING: ModelPricing = {
  input: 1,
  output: 3,
  label: '未知模型',
};

/**
 * 获取模型定价
 * @param modelId 模型 ID
 * @returns 模型定价信息
 */
export function getModelPricing(modelId: string): ModelPricing {
  return MODEL_PRICING[modelId] || DEFAULT_PRICING;
}

/**
 * 计算单次消息的费用
 * @param promptTokens 输入 token 数
 * @param completionTokens 输出 token 数
 * @param modelId 模型 ID
 * @returns 费用（美元）
 */
export function calculateMessageCost(
  promptTokens: number,
  completionTokens: number,
  modelId: string
): number {
  const pricing = getModelPricing(modelId);
  const inputCost = (promptTokens / 1000000) * pricing.input;
  const outputCost = (completionTokens / 1000000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * 格式化费用显示
 * @param cost 费用（美元）
 * @returns 格式化后的字符串
 */
export function formatCost(cost: number): string {
  if (cost === 0) {
    return '免费';
  }
  if (cost < 0.0001) {
    return '< $0.0001';
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * 格式化 token 数显示
 * @param tokens token 数量
 * @returns 格式化后的字符串
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}
