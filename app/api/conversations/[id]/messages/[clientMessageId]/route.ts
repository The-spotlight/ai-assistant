import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; clientMessageId: string }> }
) {
  const { id: conversationId, clientMessageId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }
  if (!conversationId) {
    return NextResponse.json({ error: '缺少对话 ID' }, { status: 400 });
  }
  if (!clientMessageId) {
    return NextResponse.json({ error: '缺少消息 ID' }, { status: 400 });
  }

  const body = await req.json();
  const { content } = body as { content?: string };

  if (content == null) {
    return NextResponse.json({ error: '缺少消息内容' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      deviceId,
      isDeleted: false,
    },
    select: { id: true, userId: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在或无权访问' }, { status: 404 });
  }

  const message = await prisma.message.findFirst({
    where: {
      conversationId,
      clientMessageId: decodeURIComponent(clientMessageId),
    },
  });

  if (!message) {
    return NextResponse.json({ error: '消息不存在' }, { status: 404 });
  }

  const updatedMessage = await prisma.message.update({
    where: { id: message.id },
    data: { content },
  });

  return NextResponse.json({
    success: true,
    message: {
      id: updatedMessage.clientMessageId ?? updatedMessage.id,
      role: updatedMessage.role,
      content: updatedMessage.content,
    },
  });
}
