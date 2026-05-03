import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isShareExpired } from '@/lib/share';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await ctx.params;

  try {
    const share = await prisma.share.findUnique({
      where: { shareId },
    });

    if (!share || share.isDeleted || isShareExpired(share.expiresAt)) {
      return NextResponse.json(
        { error: '分享链接不存在或已过期' },
        { status: 404 }
      );
    }

    if (share.hasPassword) {
      return NextResponse.json(
        { error: '此分享需要密码访问' },
        { status: 401 }
      );
    }

    const [reactionCounts, comments] = await Promise.all([
      prisma.shareReaction.groupBy({
        by: ['reaction'],
        where: { shareId },
        _count: { _all: true },
      }),
      prisma.shareComment.findMany({
        where: { shareId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const reactionStats: Record<string, number> = {
      useful: 0,
      notUseful: 0,
      inspiring: 0,
    };

    reactionCounts.forEach((r) => {
      if (r.reaction in reactionStats) {
        reactionStats[r.reaction] = r._count._all;
      }
    });

    return NextResponse.json({
      reactions: reactionStats,
      comments: comments.map((c) => ({
        id: c.id,
        nickname: c.nickname,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[GET /api/share/:shareId/interactions]', e);
    return NextResponse.json(
      { error: '获取互动数据失败' },
      { status: 500 }
    );
  }
}
