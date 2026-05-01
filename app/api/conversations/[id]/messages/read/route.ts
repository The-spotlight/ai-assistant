import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');

  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  if (!conversationId) {
    return NextResponse.json({ error: '缺少对话 ID' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { messageId } = body as { messageId?: string };

  if (!messageId) {
    return NextResponse.json({ error: '缺少消息 ID' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      deviceId,
      isDeleted: false,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在' }, { status: 404 });
  }

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversationId,
      role: 'user',
    },
  });

  if (!message) {
    return NextResponse.json({ error: '消息不存在' }, { status: 404 });
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true, readAt: new Date().toISOString() });
}
