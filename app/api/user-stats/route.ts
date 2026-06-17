import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const deviceId = request.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device ID' }, { status: 400 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const firstConversation = await prisma.conversation.findFirst({
      where: { deviceId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const totalDays = firstConversation
      ? Math.floor((now.getTime() - firstConversation.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    const lastActiveConversation = await prisma.conversation.findFirst({
      where: { deviceId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    const lastActiveTime = lastActiveConversation?.updatedAt || null;

    const dailyStats = await prisma.conversation.groupBy({
      by: ['updatedAt'],
      where: {
        deviceId,
        isDeleted: false,
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    dailyStats.forEach((stat) => {
      const dateStr = stat.updatedAt.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + stat._count.id);
    });

    const last7DaysUsage = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      conversationCount: count,
    }));

    return NextResponse.json({
      totalDays,
      lastActiveTime,
      last7DaysUsage,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}