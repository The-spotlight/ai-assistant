import { createOpenAI } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';
import { chatTools } from '@/lib/tools/ai-tools';

export const runtime = 'edge';

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
1. web_search — 搜索互联网获取实时信息（新闻、天气、最新事件）
2. code_execution — 执行 Python 代码（计算、数据处理）
3. calculator — 精确数学计算
4. text_analyzer — 文本分析（摘要、关键词、情感、可读性）
5. translator — 智能翻译（中/英/日/韩/法/德/西等）

📋 使用规则：
- 当用户问题需要实时信息时，使用 web_search
- 当需要计算或代码执行时，使用 code_execution 或 calculator
- 当需要分析文本时，使用 text_analyzer
- 当需要翻译时，使用 translator
- 工具调用后，基于结果给出完整、友好的回答
- 请用中文回答问题，除非用户要求其他语言`;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const modelId = process.env.OPENROUTER_MODEL ?? 'openrouter/free';

  const result = streamText({
    model: openrouter(modelId),
    system: SYSTEM_PROMPT,
    messages: messages as CoreMessage[],
    tools: chatTools,
    /** 工具调用后要继续生成回复，至少需要 2 步；不设会导致流程不完整或流异常 */
    maxSteps: 8,
  });

  return result.toDataStreamResponse();
}
