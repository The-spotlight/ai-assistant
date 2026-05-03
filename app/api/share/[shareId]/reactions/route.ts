import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isShareExpired } from '@/lib/share';
import * as crypto from 'crypto';

export const runtime = 'nodejs';

const VALID_REACTIONS = ['useful', 'notUseful', 'inspiring'] as const;
type ReactionType = (typeof VALID_REACTIONS)[number];

function generateVisitorId(): string {
  return 'v_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function POST(req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await ctx.params;

  try {
    const body = (await req.json()) as {
      reaction: string;
      visitorId?: string;
    };

    const { reaction, visitorId: providedVisitorId } = body;

    if (!reaction || !VALID_REACTIONS.includes(reaction as ReactionType)) {
      return NextResponse.json(
        { error: '无效的反应类型' },
        { status: 400 }
      );
    }

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

    const visitorId = providedVisitorId || generateVisitorId();

    try {
      await prisma.shareReaction.create({
        data: {
          shareId,
          reaction: reaction as ReactionType,
          visitorId,
        },
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: '您已经投过票了' },
          { status: 409 }
        );
      }
      throw e;
    }

    const reactionCounts = await prisma.shareReaction.groupBy({
      by: ['reaction'],
      where: { shareId },
      _count: { _all: true },
    });

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
      visitorId,
      reactions: reactionStats,
    });
  } catch (e) {
    console.error('[POST /api/share/:shareId/reactions]', e);
    return NextResponse.json(
      { error: '提交反应失败' },
      { status: 500 }
    );
  }
}
