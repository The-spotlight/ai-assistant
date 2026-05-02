import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { isFreeTierOpenRouterModel, resolveOpenRouterModelId } from '@/lib/openrouter-models';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

interface CustomModelConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  provider?: string;
}

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'compatible',
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
    'X-Title': 'AI Assistant',
  },
});

function createCustomModelClient(config: CustomModelConfig) {
  const baseUrl = config.baseUrl.endsWith('/')
    ? config.baseUrl.slice(0, -1)
    : config.baseUrl;

  return createOpenAI({
    baseURL: baseUrl,
    apiKey: config.apiKey,
    compatibility: 'compatible',
    headers: {
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
      'X-Title': 'AI Assistant',
    },
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      error: '此 API 只支持 POST 请求',
      message: '请使用 POST 请求，参数包括 systemPrompt, userPrompt',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      systemPrompt,
      userPrompt,
      customModelConfig,
      modelId,
    } = body as {
      systemPrompt?: string;
      userPrompt?: string;
      customModelConfig?: CustomModelConfig;
      modelId?: string;
    };

    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少 systemPrompt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!userPrompt || typeof userPrompt !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少 userPrompt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let model;
    let currentModelId = modelId || 'openai/gpt-4o-mini';

    if (customModelConfig) {
      const customClient = createCustomModelClient(customModelConfig);
      model = customClient(customModelConfig.modelId);
      currentModelId = customModelConfig.modelId;
    } else {
      const resolvedModelId = resolveOpenRouterModelId(currentModelId);
      model = openrouter(resolvedModelId);
    }

    const isFreeTier = !customModelConfig && isFreeTierOpenRouterModel(currentModelId);

    const result = await generateText({
      model,
      system: isFreeTier ? systemPrompt : systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

    return new Response(
      JSON.stringify({
        success: true,
        result: result.text,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[text-action] API 错误:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '处理请求时发生错误',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
