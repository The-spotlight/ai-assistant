/** OpenRouter 模型列表（客户端下拉 + 服务端白名单校验） */

export const DEFAULT_OPENROUTER_MODEL_ID = 'google/gemma-4-26b-a4b-it:free';

export const OPENROUTER_MODEL_OPTIONS: { id: string; label: string }[] = [
  { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B A4B（免费）' },
  { id: 'openrouter/free', label: 'OpenRouter 免费路由' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B Instruct（免费）' },
  { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B IT（免费）' },
  { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B Instruct（免费）' },
];

export const ALLOWED_OPENROUTER_MODEL_IDS = new Set(OPENROUTER_MODEL_OPTIONS.map((m) => m.id));

const SAFE_MODEL = /^[a-zA-Z0-9_.\/:-]+$/;

function isSafeEnvModelId(id: string): boolean {
  return id.length >= 3 && id.length <= 120 && SAFE_MODEL.test(id);
}

/**
 * 客户端选的模型必须在白名单；否则回退到环境变量（部署时可钉任意 OpenRouter id）或默认。
 */
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

export const OPENROUTER_MODEL_STORAGE_KEY = 'ai-assistant-openrouter-model';
