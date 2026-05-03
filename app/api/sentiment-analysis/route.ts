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

const SYSTEM_PROMPT = `你是一个专业的情感分析助手。你的任务是分析用户消息中的情感倾向。

## 情感分类标准：
- **积极 (positive)**：消息表达了开心、满意、感激、兴奋、希望等正面情绪
- **中性 (neutral)**：消息表达了客观事实、普通问题、没有明显情感倾向
- **消极 (negative)**：消息表达了沮丧、失望、愤怒、焦虑、悲伤等负面情绪

## 评分规则：
- 情感分数 (score)：-1 到 1 之间的浮点数
  - 1.0 表示非常积极
  - 0.5 表示比较积极
  - 0 表示完全中性
  - -0.5 表示比较消极
  - -1.0 表示非常消极
- 置信度 (confidence)：0 到 1 之间的浮数字，表示你对判断的确定程度

## 输出格式：
请直接输出一个 JSON 数组，每个元素对应一条用户消息，格式如下：
[
  {"sentiment": "positive|neutral|negative", "score": 0.8, "confidence": 0.9},
  ...
]

不要有任何其他解释或说明，只输出 JSON 数组。`;

interface MessageToAnalyze {
  id: string;
  content: string;
}

interface AnalysisResult {
  messageId: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence: number;
}

function parseAnalysisResults(responseText: string, messageIds: string[]): AnalysisResult[] {
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        const results: AnalysisResult[] = [];
        for (let i = 0; i < Math.min(parsed.length, messageIds.length); i++) {
          const item = parsed[i];
          if (
            typeof item === 'object' &&
            item !== null &&
            ['positive', 'neutral', 'negative'].includes(item.sentiment) &&
            typeof item.score === 'number' &&
            typeof item.confidence === 'number'
          ) {
            results.push({
              messageId: messageIds[i],
              sentiment: item.sentiment as 'positive' | 'neutral' | 'negative',
              score: Math.max(-1, Math.min(1, item.score)),
              confidence: Math.max(0, Math.min(1, item.confidence)),
            });
          }
        }
        if (results.length === messageIds.length) {
          return results;
        }
      }
    }
  } catch {
    // 解析失败，使用备用方法
  }

  // 兜底：返回全部中性
  return messageIds.map((id) => ({
    messageId: id,
    sentiment: 'neutral' as const,
    score: 0,
    confidence: 0.5,
  }));
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
      messages?: MessageToAnalyze[];
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
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '没有需要分析的消息' }),
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

    console.log('[sentiment-analysis] 数据库中的 modelId:', conv.modelId);

    // 准备 AI 客户端
    const isCustomModel = !!customModelConfig;
    console.log('[sentiment-analysis] 是否自定义模型:', isCustomModel);

    let actualModelId: string;
    let modelClient: ReturnType<typeof createOpenAI>;

    if (isCustomModel && customModelConfig) {
      actualModelId = customModelConfig.modelId;
      modelClient = createCustomModelClient(customModelConfig);
      console.log('[sentiment-analysis] 使用自定义模型:', actualModelId);
    } else {
      actualModelId = resolveOpenRouterModelId(conv.modelId, process.env.OPENROUTER_MODEL);
      modelClient = openrouter;
      console.log('[sentiment-analysis] 解析后的模型 ID:', actualModelId);

      if (isFreeTierOpenRouterModel(actualModelId)) {
        console.log('[sentiment-analysis] 使用免费模型:', actualModelId);
      }
    }

    // 构建分析提示词
    const messageTexts = messages.map((m, i) => `消息 ${i + 1}: ${m.content}`).join('\n\n');
    const messageIds = messages.map((m) => m.id);

    const userPrompt = `请分析以下 ${messages.length} 条用户消息的情感倾向。

${messageTexts}

请直接输出 JSON 数组格式的分析结果，每条消息对应一个对象：`;

    // 调用 AI 进行情感分析
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    console.log('[sentiment-analysis] 开始调用 AI，模型:', actualModelId);
    console.log('[sentiment-analysis] 超时时间: 30 秒');
    console.log('[sentiment-analysis] 待分析消息数:', messages.length);

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
        maxTokens: 1000,
        temperature: 0.3,
        abortSignal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = result.text.trim();
      console.log('[sentiment-analysis] AI 响应文本:', responseText);

      // 解析分析结果
      const analysisResults = parseAnalysisResults(responseText, messageIds);
      console.log('[sentiment-analysis] 解析后的分析结果:', analysisResults);

      // 计算统计数据
      const positiveCount = analysisResults.filter((r) => r.sentiment === 'positive').length;
      const neutralCount = analysisResults.filter((r) => r.sentiment === 'neutral').length;
      const negativeCount = analysisResults.filter((r) => r.sentiment === 'negative').length;
      const totalCount = analysisResults.length;

      return new Response(
        JSON.stringify({
          success: true,
          results: analysisResults,
          summary: {
            totalMessages: totalCount,
            positiveCount,
            neutralCount,
            negativeCount,
            positivePercentage: totalCount > 0 ? (positiveCount / totalCount) * 100 : 0,
            neutralPercentage: totalCount > 0 ? (neutralCount / totalCount) * 100 : 0,
            negativePercentage: totalCount > 0 ? (negativeCount / totalCount) * 100 : 0,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[sentiment-analysis] 情感分析超时（30秒）');
        return new Response(
          JSON.stringify({
            success: false,
            error: '分析超时，请稍后重试',
          }),
          {
            status: 504,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('[sentiment-analysis] 情感分析失败:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[sentiment-analysis] 请求处理失败:', error);
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
