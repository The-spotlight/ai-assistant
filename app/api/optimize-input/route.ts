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

const SYSTEM_PROMPT = `你是一个专业的问题优化助手。你的任务是帮助用户优化他们的提问，让问题更加清晰、具体，更容易获得准确的回答。

## 核心原则：
1. **保留意图**：严格保留用户的核心问题和真实意图，不得改变用户的原始需求
2. **消除模糊**：将模糊、笼统的表述改为具体、明确的表述
3. **补充细节**：如果用户的问题缺少关键信息，可以适当补充合理的假设或明确需要哪些信息
4. **优化结构**：使问题结构更清晰，逻辑更明确
5. **专业表述**：使用更专业、准确的术语（但不要过度复杂化）

## 优化策略：
- **如果问题模糊**：比如"帮我写代码" → 优化为"请帮我编写一段 [具体功能] 的代码，使用 [语言/框架]"
- **如果问题笼统**：比如"这个功能怎么实现" → 优化为"请详细说明如何实现 [具体功能]，包括 [技术栈/环境]"
- **如果缺少上下文**：可以在优化中明确指出可能需要的信息，或者基于常见场景补充
- **如果表述口语化**：转化为更正式、更清晰的书面表达

## 输出格式：
请直接输出优化后的问题文本，不要有任何其他解释或说明。不要使用列表或特殊格式，只输出优化后的纯文本内容。

示例：
用户输入："帮我弄个网站"
优化后："请帮我创建一个网站，我需要一个展示产品信息的静态页面，使用 HTML、CSS 和 JavaScript 技术栈。"

用户输入："这个错误怎么解决"
优化后："我在运行 [相关操作] 时遇到了这个错误，错误信息是：[具体错误信息]。我使用的环境是 [技术栈/版本]，请问如何解决这个问题？"

用户输入："Python 排序"
优化后："如何使用 Python 对列表进行排序？需要支持按多个条件排序，并且可以选择升序或降序，请提供具体的代码示例。"`;

export async function GET() {
  return new Response(
    JSON.stringify({
      error: '此 API 只支持 POST 请求',
      message: '请使用 POST 请求，参数包括 conversationId, deviceId, input',
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
      conversationId,
      deviceId,
      input,
      customModelConfig,
    } = body as {
      conversationId?: string;
      deviceId?: string;
      input?: string;
      customModelConfig?: CustomModelConfig;
    };

    // 验证参数
    if (!conversationId || typeof conversationId !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少 conversationId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!deviceId || typeof deviceId !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少 deviceId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: '输入内容不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证会话权限
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, deviceId },
      select: { id: true, modelId: true },
    });
    if (!conv) {
      return new Response(
        JSON.stringify({ error: '会话不存在或无权访问' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[optimize-input] 数据库中的 modelId:', conv.modelId);

    // 准备 AI 客户端
    const isCustomModel = !!customModelConfig;
    console.log('[optimize-input] 是否自定义模型:', isCustomModel);

    let actualModelId: string;
    let modelClient: ReturnType<typeof createOpenAI>;

    if (isCustomModel && customModelConfig) {
      actualModelId = customModelConfig.modelId;
      modelClient = createCustomModelClient(customModelConfig);
      console.log('[optimize-input] 使用自定义模型:', actualModelId);
    } else {
      actualModelId = resolveOpenRouterModelId(conv.modelId, process.env.OPENROUTER_MODEL);
      modelClient = openrouter;
      console.log('[optimize-input] 解析后的模型 ID:', actualModelId);
      
      if (isFreeTierOpenRouterModel(actualModelId)) {
        console.log('[optimize-input] 使用免费模型:', actualModelId);
      }
    }

    // 构建用户提示词
    const userPrompt = `请优化以下用户输入，使其更加清晰、具体、专业。请严格保留用户的核心意图，只优化表述方式：

"${input}"

请直接输出优化后的文本，不要有任何其他解释：`;

    // 调用 AI 优化输入
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log('[optimize-input] 开始调用 AI，模型:', actualModelId);
    console.log('[optimize-input] 超时时间: 15 秒');

    try {
      const result = await generateText({
        model: modelClient(actualModelId),
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        maxTokens: 500,
        temperature: 0.7,
        abortSignal: controller.signal,
      });

      clearTimeout(timeoutId);

      const optimizedText = result.text.trim();
      console.log('[optimize-input] AI 优化后的文本:', optimizedText);

      // 确保优化后的文本不为空，如果为空则返回原始输入
      const finalText = optimizedText.length > 0 ? optimizedText : input;

      return new Response(
        JSON.stringify({
          success: true,
          optimized: finalText,
          original: input,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[optimize-input] 优化输入超时（15秒）');
        return new Response(
          JSON.stringify({
            success: false,
            error: '优化超时，请稍后重试',
            original: input,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('[optimize-input] 优化输入失败:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '优化失败，请稍后重试',
          original: input,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[optimize-input] 请求处理失败:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '请求处理失败',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
