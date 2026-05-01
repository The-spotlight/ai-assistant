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

const SYSTEM_PROMPT = `你是一个专业的对话推荐助手。你的任务是根据当前的对话内容，生成 2-3 个有意义、相关的后续问题，帮助用户继续深入对话。

## 核心原则：
1. **语义理解**：深入理解 AI 回复的内容和含义，而不是简单的关键词匹配
2. **相关性**：推荐的问题必须与当前对话主题高度相关
3. **渐进性**：推荐的问题应该是对当前话题的自然延续或深入
4. **多样性**：2-3 个问题应该从不同角度切入，避免重复
5. **自然性**：问题应该像是用户真正会问的，而不是机械的模板

## 推荐策略：
- **如果 AI 给出了多步骤说明**：可以问"第 X 步具体怎么做？"、"有没有更简单的方法？"、"需要注意什么常见问题？"
- **如果 AI 解释了一个概念**：可以问"这个概念和 X 有什么区别？"、"在什么场景下使用？"、"能举个实际例子吗？"
- **如果 AI 提供了代码**：可以问"这段代码的核心逻辑是什么？"、"如何优化性能？"、"有什么边界情况需要处理？"
- **如果 AI 给出了建议**：可以问"为什么推荐这个方案？"、"还有其他替代方案吗？"、"长期来看有什么影响？"
- **如果 AI 分析了数据**：可以问"这个数据说明了什么趋势？"、"和历史数据相比有什么变化？"、"有什么异常值需要关注？"

## 输出格式：
请直接输出一个 JSON 数组，包含 2-3 个推荐的问题。不要有任何其他解释或说明。

示例：
["详细解释一下这个概念在实际项目中的应用", "有没有更简单的实现方式？", "需要注意什么性能问题？"]`;

/**
 * 解析 AI 生成的推荐追问
 * 处理各种可能的输出格式
 */
function parseSuggestions(responseText: string): string[] {
  try {
    // 尝试直接解析 JSON
    const parsed = JSON.parse(responseText);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed.slice(0, 3);
    }
  } catch {
    // 不是有效的 JSON，尝试其他方式解析
  }

  // 尝试提取 JSON 数组部分
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed.slice(0, 3);
      }
    } catch {
      // 继续尝试其他方式
    }
  }

  // 尝试按行分割（每行一个问题）
  const lines = responseText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('```') && !line.match(/^\d+[\.\)\-]/))
    .slice(0, 3);

  if (lines.length >= 2) {
    return lines;
  }

  // 兜底：返回空数组
  return [];
}

export async function GET() {
  return new Response(
    JSON.stringify({
      error: '此 API 只支持 POST 请求',
      message: '请使用 POST 请求，参数包括 conversationId, deviceId, messages',
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
      messages,
      customModelConfig,
    } = body as {
      conversationId?: string;
      deviceId?: string;
      messages?: Array<{ role: string; content: string }>;
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
    if (!messages || !Array.isArray(messages) || messages.length < 2) {
      return new Response(
        JSON.stringify({ error: '需要至少两条消息（用户问题 + AI 回复）' }),
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

    console.log('[follow-up-suggestions] 数据库中的 modelId:', conv.modelId);

    // 准备 AI 客户端
    const isCustomModel = !!customModelConfig;
    console.log('[follow-up-suggestions] 是否自定义模型:', isCustomModel);

    let actualModelId: string;
    let modelClient: ReturnType<typeof createOpenAI>;

    if (isCustomModel && customModelConfig) {
      actualModelId = customModelConfig.modelId;
      modelClient = createCustomModelClient(customModelConfig);
      console.log('[follow-up-suggestions] 使用自定义模型:', actualModelId);
    } else {
      // 使用与 chat/route.ts 相同的模型解析逻辑
      // 从数据库获取 modelId，如果不在允许列表中则使用默认模型
      actualModelId = resolveOpenRouterModelId(conv.modelId, process.env.OPENROUTER_MODEL);
      modelClient = openrouter;
      console.log('[follow-up-suggestions] 解析后的模型 ID:', actualModelId);
      
      // 检查是否是免费模型
      if (isFreeTierOpenRouterModel(actualModelId)) {
        console.log('[follow-up-suggestions] 使用免费模型:', actualModelId);
        console.log('[follow-up-suggestions] 注意：免费模型可能不支持 JSON 输出格式或响应较慢');
      }
    }

    // 构建对话上下文（只取最近的几条消息，避免 token 过多）
    // 优先取最后一次对话轮次（用户问题 + AI 回复）
    const recentMessages: Array<{ role: string; content: string }> = [];
    
    // 从后往前找最后一个用户消息
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    // 如果找到了用户消息，取从该消息开始的所有消息
    if (lastUserIndex >= 0) {
      for (let i = lastUserIndex; i < messages.length; i++) {
        recentMessages.push(messages[i]);
      }
    } else {
      // 否则取最近的 4 条消息
      recentMessages.push(...messages.slice(-4));
    }

    // 构建用户提示词
    const conversationContent = recentMessages
      .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
      .join('\n\n');

    const userPrompt = `请根据以下对话内容，生成 2-3 个有意义的后续问题：

${conversationContent}

请直接输出 JSON 数组格式的推荐问题：`;

    // 调用 AI 生成推荐追问
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log('[follow-up-suggestions] 开始调用 AI，模型:', actualModelId);
    console.log('[follow-up-suggestions] 超时时间: 15 秒');

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
        maxTokens: 200,
        temperature: 0.7,
        abortSignal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = result.text.trim();
      console.log('[follow-up-suggestions] AI 响应文本:', responseText);

      // 解析推荐追问
      const suggestions = parseSuggestions(responseText);
      console.log('[follow-up-suggestions] 解析后的推荐追问:', suggestions);

      // 如果 AI 生成失败或返回空数组，返回空（前端可以降级到规则引擎）
      return new Response(
        JSON.stringify({
          success: true,
          suggestions: suggestions,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[follow-up-suggestions] 生成推荐追问超时（15秒）');
        console.log('[follow-up-suggestions] 返回空数组，让前端使用规则引擎兜底');
        return new Response(
          JSON.stringify({
            success: true,
            error: '生成超时，使用规则引擎',
            suggestions: [],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('[follow-up-suggestions] 生成推荐追问失败:', error);
      console.log('[follow-up-suggestions] 返回空数组，让前端使用规则引擎兜底');
      return new Response(
        JSON.stringify({
          success: true,
          error: error instanceof Error ? error.message : '未知错误',
          suggestions: [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[follow-up-suggestions] 请求处理失败:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '请求处理失败',
        suggestions: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
