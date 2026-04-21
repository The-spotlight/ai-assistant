import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 删除会话及消息 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const result = await prisma.conversation.deleteMany({
    where: { id: conversationId, deviceId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

/** 更新会话置顶状态 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { isPinned?: boolean };
    const { isPinned } = body;

    if (typeof isPinned !== 'boolean') {
      return NextResponse.json({ error: 'isPinned 必须是布尔值' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, deviceId },
    });

    if (!conversation) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isPinned,
        pinnedAt: isPinned ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        modelId: true,
        isPinned: true,
        pinnedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('[PATCH /api/conversations/:id]', e);
    return NextResponse.json({ error: '更新会话失败' }, { status: 500 });
  }
}
