import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device ID' }, { status: 400 });
    }

    const whereCondition: any = {
      deviceId,
    };

    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const totalLikes = await prisma.messageFeedback.count({
      where: {
        ...whereCondition,
        liked: true,
      },
    });

    const totalDislikes = await prisma.messageFeedback.count({
      where: {
        ...whereCondition,
        disliked: true,
      },
    });

    const reasonStats = await prisma.messageFeedback.groupBy({
      by: ['reason'],
      where: {
        ...whereCondition,
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

    const formatDate = (date: Date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const dailyData: { date: string; likes: number; dislikes: number; total: number }[] = [];
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const current = new Date(start);
      while (current <= end) {
        const dateStr = formatDate(current);
        dailyData.push({
          date: dateStr,
          likes: 0,
          dislikes: 0,
          total: 0,
        });
        current.setDate(current.getDate() + 1);
      }
    }

    const dailyLikes = await prisma.messageFeedback.groupBy({
      by: ['createdAt'],
      where: {
        ...whereCondition,
        liked: true,
      },
      _count: {
        liked: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const dailyDislikes = await prisma.messageFeedback.groupBy({
      by: ['createdAt'],
      where: {
        ...whereCondition,
        disliked: true,
      },
      _count: {
        disliked: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    dailyLikes.forEach(item => {
      const dateStr = formatDate(item.createdAt);
      const existing = dailyData.find(d => d.date === dateStr);
      if (existing) {
        existing.likes = item._count.liked;
      }
    });

    dailyDislikes.forEach(item => {
      const dateStr = formatDate(item.createdAt);
      const existing = dailyData.find(d => d.date === dateStr);
      if (existing) {
        existing.dislikes = item._count.disliked;
      }
    });

    dailyData.forEach(item => {
      item.total = item.likes + item.dislikes;
    });

    const stats = {
      totalLikes,
      totalDislikes,
      reasonDistribution: reasonStats.map(item => ({
        reason: item.reason,
        count: item._count.reason,
      })),
      dailyTrend: dailyData,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}