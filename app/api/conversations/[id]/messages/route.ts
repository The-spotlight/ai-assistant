import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: '缺少对话 ID' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      deviceId,
      isDeleted: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在' }, { status: 404 });
  }

  const messages = conversation.messages.map((m, index) => {
    let showDateSeparator = false;

    if (index === 0) {
      showDateSeparator = true;
    } else {
      const prevMsg = conversation.messages[index - 1];
      const currentDate = m.createdAt;
      const prevDate = prevMsg.createdAt;

      const isSameDay =
        currentDate.getFullYear() === prevDate.getFullYear() &&
        currentDate.getMonth() === prevDate.getMonth() &&
        currentDate.getDate() === prevDate.getDate();

      showDateSeparator = !isSameDay;
    }

    return {
      id: m.clientMessageId ?? m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      toolInvocations: m.toolInvocations,
      modelId: m.modelId,
      promptTokens: m.promptTokens,
      completionTokens: m.completionTokens,
      totalTokens: m.totalTokens,
      replyToId: m.replyToId,
      replyToSnapshot: m.replyToSnapshot,
      readAt: m.readAt?.toISOString() ?? null,
      showDateSeparator,
    };
  });

  return NextResponse.json({ messages });
}
