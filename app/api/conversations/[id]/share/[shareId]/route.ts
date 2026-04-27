import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * 删除分享记录（使分享链接失效）
 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string; shareId: string }> }) {
  const { id: conversationId, shareId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    // 检查会话是否存在且属于当前设备
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, deviceId, isDeleted: false },
    });

    if (!conversation) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    // 检查分享记录是否存在且属于该会话和设备
    const share = await prisma.share.findFirst({
      where: {
        shareId,
        conversationId,
        deviceId,
      },
    });

    if (!share) {
      return NextResponse.json({ error: '分享记录不存在' }, { status: 404 });
    }

    // 软删除分享记录
    await prisma.share.update({
      where: { id: share.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[DELETE /api/conversations/:id/share/:shareId]', e);
    return NextResponse.json({ error: '删除分享失败' }, { status: 500 });
  }
}
