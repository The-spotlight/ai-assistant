import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device ID' }, { status: 400 });
    }

    // 计算总点赞和点踩数
    const totalStats = await prisma.messageFeedback.aggregate({
      where: {
        deviceId,
      },
      _sum: {
        liked: true,
        disliked: true,
      },
    });

    // 计算各原因的分布
    const reasonStats = await prisma.messageFeedback.groupBy({
      by: ['reason'],
      where: {
        deviceId,
        reason: {
          not: null,
        },
      },
      _count: {
        reason: true,
      },
      orderBy: {
        _count: {
          reason: 'desc',
        },
      },
    });

    // 格式化结果
    const stats = {
      totalLikes: totalStats._sum.liked || 0,
      totalDislikes: totalStats._sum.disliked || 0,
      reasonDistribution: reasonStats.map(item => ({
        reason: item.reason,
        count: item._count.reason,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
