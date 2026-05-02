import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

interface DailyActivity {
  date: string;
  conversationCount: number;
  messageCount: number;
}

interface MonthlyActivity {
  month: string;
  conversationCount: number;
  messageCount: number;
}

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

    const yearStart = new Date(now.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);

    const threeHundredSixtyFiveDaysAgo = new Date(now);
    threeHundredSixtyFiveDaysAgo.setDate(now.getDate() - 365);
    threeHundredSixtyFiveDaysAgo.setHours(0, 0, 0, 0);

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

    const conversationsWithMessages = await prisma.conversation.findMany({
      where: {
        deviceId,
        isDeleted: false,
        updatedAt: {
          gte: threeHundredSixtyFiveDaysAgo,
        },
      },
      select: {
        id: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    const dailyActivityMap = new Map<string, { conversations: number; messages: number }>();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      dailyActivityMap.set(dateStr, { conversations: 0, messages: 0 });
    }

    conversationsWithMessages.forEach((conv) => {
      const dateStr = conv.updatedAt.toISOString().split('T')[0];
      const existing = dailyActivityMap.get(dateStr);
      if (existing) {
        dailyActivityMap.set(dateStr, {
          conversations: existing.conversations + 1,
          messages: existing.messages + conv._count.messages,
        });
      }
    });

    const last365DaysActivity: DailyActivity[] = Array.from(dailyActivityMap.entries()).map(
      ([date, data]) => ({
        date,
        conversationCount: data.conversations,
        messageCount: data.messages,
      })
    );

    const thisYearConversations = await prisma.conversation.findMany({
      where: {
        deviceId,
        isDeleted: false,
        updatedAt: {
          gte: yearStart,
        },
      },
      select: { id: true },
    });

    const yearTotalConversations = thisYearConversations.length;

    const monthlyActivityMap = new Map<string, { conversations: number; messages: number }>();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyActivityMap.set(monthKey, { conversations: 0, messages: 0 });
    }

    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyConversations = await prisma.conversation.findMany({
      where: {
        deviceId,
        isDeleted: false,
        updatedAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        id: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    monthlyConversations.forEach((conv) => {
      const monthKey = `${conv.updatedAt.getFullYear()}-${String(conv.updatedAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyActivityMap.get(monthKey);
      if (existing) {
        monthlyActivityMap.set(monthKey, {
          conversations: existing.conversations + 1,
          messages: existing.messages + conv._count.messages,
        });
      }
    });

    const last12MonthsActivity: MonthlyActivity[] = Array.from(monthlyActivityMap.entries()).map(
      ([month, data]) => ({
        month,
        conversationCount: data.conversations,
        messageCount: data.messages,
      })
    );

    return NextResponse.json({
      totalDays,
      lastActiveTime,
      last7DaysUsage,
      last365DaysActivity,
      yearTotalConversations,
      last12MonthsActivity,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}
