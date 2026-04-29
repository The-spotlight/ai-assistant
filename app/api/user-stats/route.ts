import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getModelPricing, calculateMessageCost } from '@/lib/model-pricing';

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
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

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

    const [totalConversations, allMessages, conversationsLast30Days, conversationsWithModel, allConversations] = await Promise.all([
      prisma.conversation.count({
        where: { deviceId, isDeleted: false },
      }),
      prisma.message.findMany({
        where: {
          conversation: {
            deviceId,
            isDeleted: false,
          },
        },
        include: {
          conversation: {
            select: { modelId: true },
          },
        },
      }),
      prisma.conversation.findMany({
        where: {
          deviceId,
          isDeleted: false,
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          id: true,
          updatedAt: true,
          modelId: true,
          messages: {
            select: {
              promptTokens: true,
              completionTokens: true,
              totalTokens: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.conversation.findMany({
        where: {
          deviceId,
          isDeleted: false,
          modelId: { not: null },
        },
        select: { modelId: true },
      }),
      prisma.conversation.findMany({
        where: {
          deviceId,
          isDeleted: false,
        },
        select: { createdAt: true },
      }),
    ]);

    let totalTokens = 0;
    let totalCost = 0;

    allMessages.forEach((msg) => {
      if (msg.promptTokens != null && msg.completionTokens != null) {
        totalTokens += msg.totalTokens || (msg.promptTokens + msg.completionTokens);
        const modelId = msg.conversation.modelId || '';
        totalCost += calculateMessageCost(msg.promptTokens, msg.completionTokens, modelId);
      }
    });

    const last30DaysData = new Map<string, { date: string; tokens: number; conversations: number }>();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      last30DaysData.set(dateStr, { date: dateStr, tokens: 0, conversations: 0 });
    }

    conversationsLast30Days.forEach((conv) => {
      const dateStr = conv.updatedAt.toISOString().split('T')[0];
      const dayData = last30DaysData.get(dateStr);
      if (dayData) {
        dayData.conversations += 1;
        conv.messages.forEach((msg) => {
          if (msg.totalTokens != null) {
            dayData.tokens += msg.totalTokens;
          } else if (msg.promptTokens != null && msg.completionTokens != null) {
            dayData.tokens += msg.promptTokens + msg.completionTokens;
          }
        });
      }
    });

    const last30DaysUsage = Array.from(last30DaysData.values());

    const modelUsage = new Map<string, number>();
    conversationsWithModel.forEach((conv) => {
      if (conv.modelId) {
        modelUsage.set(conv.modelId, (modelUsage.get(conv.modelId) || 0) + 1);
      }
    });

    const modelUsageList = Array.from(modelUsage.entries()).map(([modelId, count]) => {
      const pricing = getModelPricing(modelId);
      return {
        modelId,
        label: pricing.label,
        count,
      };
    });

    const hourlyDistribution = new Array(24).fill(0);
    allConversations.forEach((conv) => {
      const hour = conv.createdAt.getHours();
      hourlyDistribution[hour]++;
    });

    const hourlyUsage = hourlyDistribution.map((count, hour) => ({
      hour,
      count,
      label: `${hour}:00`,
    }));

    return NextResponse.json({
      totalDays,
      lastActiveTime,
      last7DaysUsage,
      totalConversations,
      totalTokens,
      totalCost,
      last30DaysUsage,
      modelUsage: modelUsageList,
      hourlyUsage,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}