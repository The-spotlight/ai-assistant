export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  isFree: boolean;
  contextWindow: number;
  contextWindowLabel: string;
}

export const FIXED_OPENROUTER_MODEL_ID = 'openrouter/elephant-alpha';
export const FIXED_OPENROUTER_MODEL_LABEL = 'Elephant Alpha（OpenRouter）';

export const DEFAULT_OPENROUTER_MODEL_ID = 'openrouter/free';

export const OPENROUTER_MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'openrouter/free',
    label: 'OpenRouter 免费路由',
    provider: 'OpenRouter',
    isFree: true,
    contextWindow: 4096,
    contextWindowLabel: '4K',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    label: 'Gemma 4 26B A4B',
    provider: 'Google',
    isFree: true,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
  {
    id: 'openrouter/elephant-alpha',
    label: FIXED_OPENROUTER_MODEL_LABEL,
    provider: 'OpenRouter',
    isFree: true,
    contextWindow: 8192,
    contextWindowLabel: '8K',
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    label: 'Llama 3.2 3B Instruct',
    provider: 'Meta',
    isFree: true,
    contextWindow: 8192,
    contextWindowLabel: '8K',
  },
  {
    id: 'google/gemma-2-9b-it:free',
    label: 'Gemma 2 9B IT',
    provider: 'Google',
    isFree: true,
    contextWindow: 8192,
    contextWindowLabel: '8K',
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    label: 'Mistral 7B Instruct',
    provider: 'Mistral',
    isFree: true,
    contextWindow: 8192,
    contextWindowLabel: '8K',
  },
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    isFree: false,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
  {
    id: 'openai/gpt-4-turbo',
    label: 'GPT-4 Turbo',
    provider: 'OpenAI',
    isFree: false,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
  {
    id: 'openai/gpt-4',
    label: 'GPT-4',
    provider: 'OpenAI',
    isFree: false,
    contextWindow: 8192,
    contextWindowLabel: '8K',
  },
  {
    id: 'openai/gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    isFree: false,
    contextWindow: 16384,
    contextWindowLabel: '16K',
  },
  {
    id: 'anthropic/claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    isFree: false,
    contextWindow: 200000,
    contextWindowLabel: '200K',
  },
  {
    id: 'anthropic/claude-3-opus',
    label: 'Claude 3 Opus',
    provider: 'Anthropic',
    isFree: false,
    contextWindow: 200000,
    contextWindowLabel: '200K',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    label: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    isFree: false,
    contextWindow: 200000,
    contextWindowLabel: '200K',
  },
  {
    id: 'anthropic/claude-3-haiku',
    label: 'Claude 3 Haiku',
    provider: 'Anthropic',
    isFree: false,
    contextWindow: 200000,
    contextWindowLabel: '200K',
  },
  {
    id: 'google/gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    provider: 'Google',
    isFree: false,
    contextWindow: 1048576,
    contextWindowLabel: '1M',
  },
  {
    id: 'google/gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    provider: 'Google',
    isFree: false,
    contextWindow: 1048576,
    contextWindowLabel: '1M',
  },
  {
    id: 'deepseek/deepseek-chat',
    label: 'DeepSeek Chat',
    provider: 'DeepSeek',
    isFree: false,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
  {
    id: 'deepseek/deepseek-r1-chat',
    label: 'DeepSeek R1 Chat',
    provider: 'DeepSeek',
    isFree: false,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    isFree: false,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
  {
    id: 'meta-llama/llama-3.3-8b-instruct',
    label: 'Llama 3.3 8B Instruct',
    provider: 'Meta',
    isFree: false,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
  {
    id: 'mistralai/mistral-large',
    label: 'Mistral Large',
    provider: 'Mistral',
    isFree: false,
    contextWindow: 128000,
    contextWindowLabel: '128K',
  },
];

export const DEFAULT_OPENROUTER_MODEL_LABEL =
  OPENROUTER_MODEL_OPTIONS.find((m) => m.id === DEFAULT_OPENROUTER_MODEL_ID)?.label ??
  DEFAULT_OPENROUTER_MODEL_ID;

export const ALLOWED_OPENROUTER_MODEL_IDS = new Set(OPENROUTER_MODEL_OPTIONS.map((m) => m.id));

export function isAllowedOpenRouterModelId(id: string): boolean {
  return ALLOWED_OPENROUTER_MODEL_IDS.has(id.trim());
}

export function isFreeTierOpenRouterModel(modelId: string): boolean {
  const id = modelId.trim();
  return id === 'openrouter/free' || id.includes(':free');
}

const SAFE_MODEL = /^[a-zA-Z0-9_.\/:-]+$/;

function isSafeEnvModelId(id: string): boolean {
  return id.length >= 3 && id.length <= 120 && SAFE_MODEL.test(id);
}

export function resolveOpenRouterModelId(
  bodyModel: unknown,
  envModel: string | undefined
): string {
  const fromBody = typeof bodyModel === 'string' ? bodyModel.trim() : '';
  if (fromBody && ALLOWED_OPENROUTER_MODEL_IDS.has(fromBody)) {
    return fromBody;
  }

  const fromEnv = envModel?.trim();
  if (fromEnv && isSafeEnvModelId(fromEnv)) {
    return fromEnv;
  }

  return DEFAULT_OPENROUTER_MODEL_ID;
}