import { createHash, randomUUID } from 'node:crypto';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';
import { chatTools } from '@/lib/tools/ai-tools';
import { isFreeTierOpenRouterModel, resolveOpenRouterModelId } from '@/lib/openrouter-models';
import { toolInvocationsFromSteps } from '@/lib/chat-persist';
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

const SYSTEM_PROMPT = `你是一个强大的 AI 助手，具备以下能力：

🛠️ 可用工具：
1. web_search — 搜索互联网获取实时信息（新闻、最新事件）
2. code_execution — 执行 Python 代码（计算、数据处理）
3. calculator — 精确数学计算
4. text_analyzer — 文本分析（摘要、关键词、情感、可读性）
5. translator — 智能翻译（中/英/日/韩/法/德/西等）
6. weather — 查询实时天气和天气预报（气温、降水、风向、紫外线等）

📋 使用规则：
- 当用户询问天气、气温、降水、风向、紫外线指数等气象信息时，优先使用 weather 工具
- 当用户问题需要其他实时信息（新闻、最新事件）时，使用 web_search
- 当需要计算或代码执行时，使用 code_execution 或 calculator
- 当需要分析文本时，使用 text_analyzer
- 当需要翻译时，使用 translator
- 工具调用后，基于结果给出完整、友好的回答
- 请用中文回答问题，除非用户要求其他语言`;

/** 免费模型无服务端工具：避免模型在多步 function calling 上流式无法结束，导致前端一直「正在生成」。 */
const SYSTEM_PROMPT_NO_TOOLS = `你是一个友好的中文 AI 助手。

当前使用的免费模型不支持联网搜索、代码执行、天气 API 等工具。
请基于已有知识直接回答；若问题强依赖实时信息，请诚实说明你无法联网查询，并给出通用思路或建议。

请用中文回答，除非用户要求其他语言。`;

function normalizeTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => {
        if (p && typeof p === 'object' && 'text' in p) {
          return String((p as { text: string }).text);
        }
        return '';
      })
      .join('');
  }
  return '';
}

/** 与前端 useChat 最后一条 assistant 的 id 一致，便于收藏用 clientMessageId 命中 */
function lastAssistantClientIdFromMessages(messages: CoreMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as CoreMessage & { id?: string };
    if (m.role !== 'assistant') continue;
    if (typeof m.id === 'string' && m.id.length > 0) return m.id;
    break;
  }
  return null;
}

function lastUserFromMessages(
  messages: CoreMessage[],
  conversationId: string
): { clientId: string; text: string } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as CoreMessage & { id?: string };
    if (m.role !== 'user') continue;
    const text = normalizeTextContent(m.content);
    if (!text) continue;
    const clientId =
      typeof m.id === 'string'
        ? m.id
        : `user_${createHash('sha256').update(`${conversationId}\n${text}`).digest('hex').slice(0, 32)}`;
    return { clientId, text };
  }
  return null;
}

type ReplyToInfo = {
  messageId: string;
  content: string;
  createdAt: string;
  role: string;
};

async function persistUserMessage(
  conversationId: string,
  clientId: string,
  text: string,
  userId: string,
  replyTo?: ReplyToInfo | null
): Promise<void> {
  try {
    // 查找被引用的消息（通过 clientMessageId 或 id）
    let repliedMessageId: string | null = null;
    let replyToSnapshot: string | null = null;

    if (replyTo) {
      // 查找被引用的消息
      const repliedMessage = await prisma.message.findFirst({
        where: {
          conversationId,
          OR: [
            { clientMessageId: replyTo.messageId },
            { id: replyTo.messageId },
          ],
        },
        select: { id: true, content: true, createdAt: true, role: true },
      });

      if (repliedMessage) {
        repliedMessageId = repliedMessage.id;
        // 保存引用快照（前50字 + 时间）
        replyToSnapshot = JSON.stringify({
          content: repliedMessage.content.slice(0, 50) + (repliedMessage.content.length > 50 ? '...' : ''),
          createdAt: repliedMessage.createdAt.toISOString(),
          role: repliedMessage.role,
          isDeleted: false,
        });
      } else {
        // 如果找不到被引用的消息，仍然保存快照（显示为已删除）
        replyToSnapshot = JSON.stringify({
          content: replyTo.content,
          createdAt: replyTo.createdAt,
          role: replyTo.role,
          isDeleted: true,
        });
      }
    }

    await prisma.message.create({
      data: {
        userId,
        conversationId,
        role: 'user',
        content: text,
        clientMessageId: clientId,
        ...(repliedMessageId ? { replyToId: repliedMessageId } : {}),
        ...(replyToSnapshot ? { replyToSnapshot } : {}),
      },
    });
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    ) {
      return;
    }
    throw e;
  }
}

async function generateTitleFromMessages(messages: { role: string; content: string }[]): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const modelId = resolveOpenRouterModelId(undefined, process.env.OPENROUTER_MODEL);
    
    const conversationContent = messages
      .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
      .join('\n');

    const result = await streamText({
      model: openrouter(modelId),
      system: `你是一个标题生成助手。根据用户提供的对话内容，生成一个简洁、准确、有概括性的标题。

要求：
1. 标题长度控制在 4-15 个汉字之间
2. 标题要能准确概括对话的主要内容
3. 使用简洁的中文表达
4. 不要使用特殊符号或格式
5. 直接输出标题，不要有任何解释或说明

示例：
- 如果对话是关于天气查询，标题可以是"天气查询"
- 如果对话是关于 Python 代码问题，标题可以是"Python 代码问题"
- 如果对话是关于翻译，标题可以是"翻译需求"
- 如果对话是关于搜索信息，标题可以是"信息搜索"`,
      messages: [
        {
          role: 'user',
          content: `请为以下对话生成一个简洁的标题：\n\n${conversationContent}\n\n标题：`,
        },
      ],
      maxTokens: 30,
      temperature: 0.3,
      abortSignal: controller.signal,
    });

    const generatedTitle = (await result.text).trim();
    clearTimeout(timeoutId);
    
    if (generatedTitle && generatedTitle.length > 0 && generatedTitle.length <= 30) {
      return generatedTitle;
    }
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[generateTitleFromMessages] 生成标题超时');
    } else {
      console.error('[generateTitleFromMessages] 生成标题失败:', error);
    }
    return null;
  }
}

async function ensureConversationTitle(conversationId: string): Promise<void> {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.title && conv.title !== '新对话')) return;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 4,
    select: { role: true, content: true },
  });

  if (messages.length === 0) return;

  const generatedTitle = await generateTitleFromMessages(messages);
  if (generatedTitle) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: generatedTitle },
    });
    return;
  }

  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage?.content) return;
  const t = firstUserMessage.content.trim().slice(0, 48);
  if (!t) return;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: t },
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({ 
      error: '此 API 只支持 POST 请求', 
      message: '请通过前端应用正常使用聊天功能，或使用 curl 命令测试：curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d \'{"messages": [{"role": "user", "content": "你好"}], "conversationId": "your-conversation-id", "deviceId": "your-device-id"}\''
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
  const body = await req.json();
  const { messages, model: bodyModel, conversationId: bodyConversationId, deviceId: bodyDeviceId, replyTo, temperature, maxTokens, streaming, id, customModelConfig } = body as {
    messages?: CoreMessage[];
    model?: string;
    conversationId?: string;
    deviceId?: string;
    replyTo?: ReplyToInfo | null;
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
    id?: string;
    customModelConfig?: CustomModelConfig;
  };

  const conversationId = bodyConversationId || id;
  const deviceId = bodyDeviceId || req.headers.get('x-device-id') || req.headers.get('X-Device-Id');

  if (!conversationId || typeof conversationId !== 'string') {
    return new Response(JSON.stringify({ error: '缺少 conversationId', detail: '请先创建会话或选择一个现有会话' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!deviceId || typeof deviceId !== 'string') {
    return new Response(JSON.stringify({ error: '缺少 deviceId', detail: '请确保已正确初始化设备标识' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, deviceId },
    select: { id: true, userId: true },
  });
  if (!conv) {
    return new Response(JSON.stringify({ error: '会话不存在或无权访问' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isCustomModel = !!customModelConfig;
  const modelId = isCustomModel 
    ? (bodyModel || `custom_${customModelConfig?.modelId}`)
    : resolveOpenRouterModelId(bodyModel, process.env.OPENROUTER_MODEL);
  
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { modelId },
  });

  const validTemperature = (typeof temperature === 'number' && temperature >= 0 && temperature <= 2)
    ? temperature
    : 0.7;
  const validMaxTokens = (typeof maxTokens === 'number' && maxTokens >= 1 && maxTokens <= 128000)
    ? maxTokens
    : 4096;

  const coreMessages = (messages ?? []) as CoreMessage[];
  const lastUser = lastUserFromMessages(coreMessages, conversationId);
  
  // 保存用户消息时传递引用信息
  let lastUserMessageId: string | null = null;
  if (lastUser) {
    await persistUserMessage(conversationId, lastUser.clientId, lastUser.text, conv.userId, replyTo);
    
    // 查找刚保存的用户消息 ID，用于 AI 回复的引用
    const savedUserMessage = await prisma.message.findFirst({
      where: {
        conversationId,
        OR: [
          { clientMessageId: lastUser.clientId },
        ],
      },
      select: { id: true, replyToId: true, replyToSnapshot: true },
      orderBy: { createdAt: 'desc' },
    });
    
    if (savedUserMessage) {
      lastUserMessageId = savedUserMessage.id;
    }
  }

  const useTools = !isCustomModel && !isFreeTierOpenRouterModel(modelId);

  const modelClient = isCustomModel && customModelConfig 
    ? createCustomModelClient(customModelConfig)
    : openrouter;
  
  const actualModelId = isCustomModel && customModelConfig 
    ? customModelConfig.modelId 
    : modelId;

  const result = streamText({
    model: modelClient(actualModelId),
    system: useTools ? SYSTEM_PROMPT : SYSTEM_PROMPT_NO_TOOLS,
    messages: coreMessages,
    temperature: validTemperature,
    maxTokens: validMaxTokens,
    ...(useTools ? { tools: chatTools, maxSteps: 8 } : { maxSteps: 1 }),
    // 勿在此 await 长时间 IO：SDK 会 await onFinish，阻塞 fullStream 收尾会导致客户端收不到 finish_message，界面一直「正在生成」。
    onFinish: (event) => {
      void (async () => {
        try {
          const inv = toolInvocationsFromSteps(
            event.steps as {
              toolCalls: { toolName: string; args: unknown }[];
              toolResults: { result?: unknown }[];
            }[]
          );
          const usage = event.usage as {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
          } | null;

          const assistantClientId =
            lastAssistantClientIdFromMessages(coreMessages) ?? `asst_${randomUUID()}`;

          // 如果用户消息有引用，AI 回复也继承引用关系
          let aiReplyToId: string | null = null;
          let aiReplyToSnapshot: string | null = null;
          
          if (lastUserMessageId) {
            const userMessage = await prisma.message.findUnique({
              where: { id: lastUserMessageId },
              select: { replyToId: true, replyToSnapshot: true },
            });
            
            if (userMessage?.replyToId && userMessage.replyToSnapshot) {
              aiReplyToId = userMessage.replyToId;
              aiReplyToSnapshot = userMessage.replyToSnapshot;
            }
          }

          await prisma.message.create({
            data: {
              userId: conv.userId,
              conversationId,
              role: 'assistant',
              content: event.text,
              clientMessageId: assistantClientId,
              modelId,
              ...(inv != null ? { toolInvocations: inv as object } : {}),
              ...(usage?.promptTokens != null ? { promptTokens: usage.promptTokens } : {}),
              ...(usage?.completionTokens != null ? { completionTokens: usage.completionTokens } : {}),
              ...(usage?.totalTokens != null ? { totalTokens: usage.totalTokens } : {}),
              ...(aiReplyToId ? { replyToId: aiReplyToId } : {}),
              ...(aiReplyToSnapshot ? { replyToSnapshot: aiReplyToSnapshot } : {}),
            },
          });
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
          await ensureConversationTitle(conversationId);
        } catch (e) {
          console.error('[chat] onFinish persist failed', e);
        }
      })();
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      console.error('[chat] stream', error);
      return error instanceof Error ? error.message : '生成失败';
    },
  });
}
