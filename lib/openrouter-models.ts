/** OpenRouter：默认走免费路由；白名单供服务端校验 body；可选付费模型保留在列表中 */

export const FIXED_OPENROUTER_MODEL_ID = 'openrouter/elephant-alpha';
export const FIXED_OPENROUTER_MODEL_LABEL = 'Elephant Alpha（OpenRouter）';

/** 首次进入 / 无本地存储时的默认模型 */
export const DEFAULT_OPENROUTER_MODEL_ID = 'openrouter/free';

export const OPENROUTER_MODEL_OPTIONS: { id: string; label: string }[] = [
  { id: 'openrouter/free', label: 'OpenRouter 免费路由（默认）' },
  { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B A4B（免费）' },
  { id: 'openrouter/elephant-alpha', label: FIXED_OPENROUTER_MODEL_LABEL },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B Instruct（免费）' },
  { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B IT（免费）' },
  { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B Instruct（免费）' },
];

/** 页头等静态展示用（与 {@link DEFAULT_OPENROUTER_MODEL_ID} 对应） */
export const DEFAULT_OPENROUTER_MODEL_LABEL =
  OPENROUTER_MODEL_OPTIONS.find((m) => m.id === DEFAULT_OPENROUTER_MODEL_ID)?.label ??
  DEFAULT_OPENROUTER_MODEL_ID;

export const ALLOWED_OPENROUTER_MODEL_IDS = new Set(OPENROUTER_MODEL_OPTIONS.map((m) => m.id));

export function isAllowedOpenRouterModelId(id: string): boolean {
  return ALLOWED_OPENROUTER_MODEL_IDS.has(id.trim());
}

/** 免费路由或 `:free` 模型：多步 tool streaming 在部分提供商上易挂死，聊天接口会关闭 tools。 */
export function isFreeTierOpenRouterModel(modelId: string): boolean {
  const id = modelId.trim();
  return id === 'openrouter/free' || id.includes(':free');
}

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
