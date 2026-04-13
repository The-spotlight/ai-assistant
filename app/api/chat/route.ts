import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

/** OpenRouter exposes an OpenAI-compatible API; see https://openrouter.ai/docs */
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'compatible',
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
    'X-Title': 'AI Assistant',
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const modelId = process.env.OPENROUTER_MODEL ?? 'openrouter/free';

  const result = streamText({
    model: openrouter(modelId),
    system: '你是一个有帮助的 AI 助手，请用中文回答问题。',
    messages,
  });

  return result.toDataStreamResponse();
}
