import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 拉取某会话下的消息（供 useChat initialMessages） */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, deviceId },
  });
  if (!conv) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 });
  }

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  const messages = rows.map((m) => ({
    id: m.clientMessageId ?? m.id,
    role: m.role,
    content: m.content,
    ...(m.toolInvocations != null
      ? { toolInvocations: m.toolInvocations as unknown[] }
      : {}),
    ...(m.promptTokens != null ? { promptTokens: m.promptTokens } : {}),
    ...(m.completionTokens != null ? { completionTokens: m.completionTokens } : {}),
    ...(m.totalTokens != null ? { totalTokens: m.totalTokens } : {}),
    ...(m.modelId != null ? { modelId: m.modelId } : {}),
  }));

  return NextResponse.json({ messages });
}
