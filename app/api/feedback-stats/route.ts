import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const modelId = request.nextUrl.searchParams.get('modelId');
    const includeModels = request.nextUrl.searchParams.get('includeModels') === 'true';

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

    const conversationCondition: any = {};
    if (modelId && modelId !== 'all') {
      conversationCondition.modelId = modelId;
    }

    const totalLikes = await prisma.messageFeedback.count({
      where: {
        ...whereCondition,
        liked: true,
        conversation: {
          ...conversationCondition,
        },
      },
    });

    const totalDislikes = await prisma.messageFeedback.count({
      where: {
        ...whereCondition,
        disliked: true,
        conversation: {
          ...conversationCondition,
        },
      },
    });

    const reasonStats = await prisma.messageFeedback.groupBy({
      by: ['reason'],
      where: {
        ...whereCondition,
        reason: {
          not: null,
        },
        conversation: {
          ...conversationCondition,
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

    const dailyLikes = await prisma.messageFeedback.groupBy({
      by: ['createdAt'],
      where: {
        ...whereCondition,
        liked: true,
        conversation: {
          ...conversationCondition,
        },
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
        conversation: {
          ...conversationCondition,
        },
      },
      _count: {
        disliked: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const modelStats = includeModels ? await prisma.messageFeedback.groupBy({
      by: ['conversationId'],
      where: {
        ...whereCondition,
        conversation: {
          ...(modelId ? conversationCondition : {}),
        },
      },
      _count: {
        liked: true,
        disliked: true,
      },
    }) : null;

    const models = includeModels ? await prisma.conversation.findMany({
      where: {
        deviceId,
        feedbacks: {
          some: {
            ...whereCondition,
          },
        },
      },
      select: {
        id: true,
        modelId: true,
      },
    }) : null;

    const modelFeedbackMap = new Map<string, { likes: number; dislikes: number }>();
    if (modelStats && models) {
      const convModelMap = new Map(models.map(m => [m.id, m.modelId || '未知模型']));
      modelStats.forEach(stat => {
        const modelId = convModelMap.get(stat.conversationId) || '未知模型';
        const existing = modelFeedbackMap.get(modelId) || { likes: 0, dislikes: 0 };
        existing.likes += stat._count.liked || 0;
        existing.dislikes += stat._count.disliked || 0;
        modelFeedbackMap.set(modelId, existing);
      });
    }

    const modelDistribution = Array.from(modelFeedbackMap.entries()).map(([modelId, counts]) => ({
      modelId,
      likes: counts.likes,
      dislikes: counts.dislikes,
      total: counts.likes + counts.dislikes,
    })).sort((a, b) => b.total - a.total);

    const availableModels = includeModels ? Array.from(new Set(models?.map(m => m.modelId) || []))
      .filter(Boolean) as string[] : [];

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
      modelDistribution,
      availableModels,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}