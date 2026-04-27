import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * 获取分享的访问记录
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string; shareId: string }> }) {
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

    // 检查分享是否存在且属于该会话
    const share = await prisma.share.findFirst({
      where: {
        shareId,
        conversationId,
        deviceId,
      },
    });

    if (!share) {
      return NextResponse.json({ error: '分享不存在' }, { status: 404 });
    }

    // 获取访问记录
    const views = await prisma.shareView.findMany({
      where: { shareId },
      orderBy: { viewedAt: 'desc' },
    });

    return NextResponse.json(views);
  } catch (e) {
    console.error('[GET /api/conversations/:id/share/:shareId/views]', e);
    return NextResponse.json({ error: '获取访问记录失败' }, { status: 500 });
  }
}
