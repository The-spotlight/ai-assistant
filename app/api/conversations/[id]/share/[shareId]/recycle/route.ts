import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * 恢复已删除的分享记录
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string; shareId: string }> }) {
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

    // 检查分享记录是否存在且属于该会话和设备，并且是已删除状态
    const share = await prisma.share.findFirst({
      where: {
        shareId,
        conversationId,
        deviceId,
        isDeleted: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: '分享记录不存在或未被删除' }, { status: 404 });
    }

    // 恢复分享记录
    await prisma.share.update({
      where: { id: share.id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[POST /api/conversations/:id/share/:shareId/recycle]', e);
    return NextResponse.json({ error: '恢复分享失败' }, { status: 500 });
  }
}

/**
 * 永久删除已删除的分享记录
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

    // 检查分享记录是否存在且属于该会话和设备，并且是已删除状态
    const share = await prisma.share.findFirst({
      where: {
        shareId,
        conversationId,
        deviceId,
        isDeleted: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: '分享记录不存在或未被删除' }, { status: 404 });
    }

    // 永久删除分享记录
    await prisma.share.delete({
      where: { id: share.id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[DELETE /api/conversations/:id/share/:shareId/recycle]', e);
    return NextResponse.json({ error: '永久删除分享失败' }, { status: 500 });
  }
}
