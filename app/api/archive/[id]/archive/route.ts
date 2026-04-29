import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 存档会话 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, deviceId, isDeleted: false, isArchived: false },
  });

  if (!conversation) {
    return NextResponse.json({ error: '会话不存在或已被存档' }, { status: 404 });
  }

  const archived = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      modelId: true,
      isPinned: true,
      pinnedAt: true,
      isArchived: true,
      archivedAt: true,
      orderIndex: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(archived);
}
