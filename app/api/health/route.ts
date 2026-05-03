import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CURRENT_VERSION } from '@/lib/changelog';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const deviceId = request.headers.get('x-device-id');

  try {
    const startTime = Date.now();

    let dbStatus = 'healthy' as 'healthy' | 'warning' | 'error';
    let tableCount = 0;
    let totalRecords = 0;
    let dbError: string | undefined;

    const conversationCount = await prisma.conversation.count({
      where: deviceId ? { deviceId } : {},
    });

    const messageCount = await prisma.message.count({
      where: deviceId
        ? {
            conversation: {
              deviceId,
            },
          }
        : {},
    });

    const favoriteCount = await prisma.favorite.count({
      where: deviceId ? { deviceId } : {},
    });

    const templateCount = await prisma.template.count({
      where: deviceId ? { deviceId } : {},
    });

    try {
      const models = [
        prisma.conversation,
        prisma.message,
        prisma.favorite,
        prisma.template,
        prisma.user,
        prisma.share,
        prisma.userSetting,
        prisma.userFeedback,
        prisma.session,
      ];

      tableCount = models.length;
      totalRecords = conversationCount + messageCount + favoriteCount + templateCount;
    } catch (error) {
      dbStatus = 'warning';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }

    const dbLatency = Date.now() - startTime;

    if (dbLatency > 2000) {
      dbStatus = 'warning';
    }

    let overallStatus = 'healthy' as 'healthy' | 'warning' | 'error';
    if (dbStatus === 'error') {
      overallStatus = 'error';
    } else if (dbStatus === 'warning') {
      overallStatus = 'warning';
    }

    return NextResponse.json({
      overallStatus,
      version: CURRENT_VERSION,
      checkedAt: new Date().toISOString(),
      database: {
        status: dbStatus,
        latency: dbLatency,
        tableCount,
        totalRecords,
        error: dbError,
      },
      storage: {
        conversationCount,
        messageCount,
        favoriteCount,
        templateCount,
      },
    });
  } catch (error) {
    console.error('Error fetching health status:', error);

    return NextResponse.json(
      {
        overallStatus: 'error',
        version: CURRENT_VERSION,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        database: {
          status: 'error',
          latency: 0,
          tableCount: 0,
          totalRecords: 0,
          error: error instanceof Error ? error.message : 'Database connection failed',
        },
        storage: {
          conversationCount: 0,
          messageCount: 0,
          favoriteCount: 0,
          templateCount: 0,
        },
      },
      { status: 500 }
    );
  }
}
