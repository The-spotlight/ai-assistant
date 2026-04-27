import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device ID' }, { status: 400 });
    }

    // 计算总点赞数
    const totalLikes = await prisma.messageFeedback.count({
      where: {
        deviceId,
        liked: true,
      },
    });

    // 计算总点踩数
    const totalDislikes = await prisma.messageFeedback.count({
      where: {
        deviceId,
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
      totalLikes,
      totalDislikes,
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
