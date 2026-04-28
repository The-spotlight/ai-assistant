import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUniqueShareId } from '@/lib/share';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    let body: { expiresInDays?: number } = {};
    try {
      body = (await req.json()) as { expiresInDays?: number };
    } catch {
      // 允许没有 body 的请求
    }

    const { expiresInDays } = body;

    // 检查会话是否存在且属于当前设备
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, deviceId, isDeleted: false },
      select: {
        userId: true,
        title: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    if (conversation.messages.length === 0) {
      return NextResponse.json({ error: '空会话无法分享' }, { status: 400 });
    }

    // 检查是否已经分享过（可选：如果会话已分享过，可以返回现有的分享链接，或者创建新的）
    // 这里选择每次都创建新的分享，这样用户可以分享到不同的地方，并且可以单独设置不同的过期时间

    const shareId = await generateUniqueShareId();

    // 计算过期时间
    let expiresAt: Date | null = null;
    if (typeof expiresInDays === 'number' && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // 创建分享记录
    const share = await prisma.share.create({
      data: {
        userId: conversation.userId,
        shareId,
        conversationId,
        deviceId,
        title: conversation.title,
        expiresAt,
        hasPassword: false,
        passwordHash: null,
      },
    });

    // 生成分享链接
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/s/${share.shareId}`;

    return NextResponse.json({
      shareId: share.shareId,
      shareUrl,
      title: share.title,
      expiresAt: share.expiresAt?.toISOString() || null,
      createdAt: share.createdAt.toISOString(),
    });
  } catch (e) {
    console.error('[POST /api/conversations/:id/share]', e);
    return NextResponse.json({ error: '创建分享失败' }, { status: 500 });
  }
}

/**
 * 获取会话的分享记录列表
 * 支持获取活跃分享和回收区分享
 * 通过 query 参数 recycle=true 获取回收区分享
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  const url = new URL(req.url);
  const isRecycle = url.searchParams.get('recycle') === 'true';
  
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

    // 构建查询条件
    const where = {
      conversationId,
      deviceId,
      isDeleted: isRecycle,
    };

    // 如果是回收区，只获取7天内的记录
    if (isRecycle) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      Object.assign(where, {
        deletedAt: { gte: sevenDaysAgo },
      });
    }

    // 获取分享记录
    const shares = await prisma.share.findMany({
      where,
      orderBy: isRecycle ? { deletedAt: 'desc' } : { createdAt: 'desc' },
    });

    const shareUrlPrefix = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/s/`;

    // 为每个分享获取访问次数和最近一次访问时间
    const sharesWithUrl = await Promise.all(
      shares.map(async (share) => {
        const viewCount = await prisma.shareView.count({
          where: { shareId: share.shareId },
        });
        const latestView = await prisma.shareView.findFirst({
          where: { shareId: share.shareId },
          orderBy: { viewedAt: 'desc' },
        });
        return {
          shareId: share.shareId,
          shareUrl: `${shareUrlPrefix}${share.shareId}`,
          title: share.title,
          expiresAt: share.expiresAt?.toISOString() || null,
          hasPassword: share.hasPassword,
          createdAt: share.createdAt.toISOString(),
          deletedAt: share.deletedAt?.toISOString() || null,
          viewCount,
          lastViewedAt: latestView?.viewedAt.toISOString() || null,
        };
      })
    );

    return NextResponse.json(sharesWithUrl);
  } catch (e) {
    console.error(`[GET /api/conversations/:id/share${isRecycle ? ' (recycle)' : ''}]`, e);
    return NextResponse.json({ error: `获取${isRecycle ? '回收区' : ''}分享列表失败` }, { status: 500 });
  }
}
