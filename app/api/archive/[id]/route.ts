import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 从存档彻底删除会话 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, deviceId, isDeleted: false, isArchived: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: '存档中不存在该会话' }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
