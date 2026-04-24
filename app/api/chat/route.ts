import { createHash, randomUUID } from 'node:crypto';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';
import { chatTools } from '@/lib/tools/ai-tools';
import { resolveOpenRouterModelId } from '@/lib/openrouter-models';
import { toolInvocationsFromSteps } from '@/lib/chat-persist';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'compatible',
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
    'X-Title': 'AI Assistant',
  },
});

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

async function persistUserMessage(
  conversationId: string,
  clientId: string,
  text: string
): Promise<void> {
  try {
    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: text,
        clientMessageId: clientId,
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

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, model: bodyModel, conversationId, deviceId } = body as {
    messages?: CoreMessage[];
    model?: string;
    conversationId?: string;
    deviceId?: string;
  };

  if (!conversationId || typeof conversationId !== 'string') {
    return new Response(JSON.stringify({ error: '缺少 conversationId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!deviceId || typeof deviceId !== 'string') {
    return new Response(JSON.stringify({ error: '缺少 deviceId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, deviceId },
  });
  if (!conv) {
    return new Response(JSON.stringify({ error: '会话不存在或无权访问' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const modelId = resolveOpenRouterModelId(bodyModel, process.env.OPENROUTER_MODEL);
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { modelId },
  });

  const coreMessages = (messages ?? []) as CoreMessage[];
  const lastUser = lastUserFromMessages(coreMessages, conversationId);
  if (lastUser) {
    await persistUserMessage(conversationId, lastUser.clientId, lastUser.text);
  }

  const result = streamText({
    model: openrouter(modelId),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    tools: chatTools,
    maxSteps: 8,
    onFinish: async (event) => {
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

        await prisma.message.create({
          data: {
            conversationId,
            role: 'assistant',
            content: event.text,
            clientMessageId: assistantClientId,
            ...(inv != null ? { toolInvocations: inv as object } : {}),
            ...(usage?.promptTokens != null ? { promptTokens: usage.promptTokens } : {}),
            ...(usage?.completionTokens != null ? { completionTokens: usage.completionTokens } : {}),
            ...(usage?.totalTokens != null ? { totalTokens: usage.totalTokens } : {}),
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
    },
  });

  return result.toDataStreamResponse();
}
