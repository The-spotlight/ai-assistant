import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 从回收站恢复会话 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, deviceId, isDeleted: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: '回收站中不存在该会话' }, { status: 404 });
  }

  const restored = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      isDeleted: false,
      deletedAt: null,
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

  return NextResponse.json(restored);
}
