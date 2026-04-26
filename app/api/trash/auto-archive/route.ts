import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { days } = body as { days?: number };

    if (days === undefined || typeof days !== 'number') {
      return NextResponse.json({ error: '缺少 days 参数' }, { status: 400 });
    }

    const validDays = [7, 30, 90];
    if (!validDays.includes(days)) {
      return NextResponse.json({ error: 'days 参数必须是 7、30 或 90' }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const conversationsToArchive = await prisma.conversation.findMany({
      where: {
        deviceId,
        isDeleted: false,
        updatedAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    if (conversationsToArchive.length === 0) {
      return NextResponse.json({
        success: true,
        archivedCount: 0,
        message: '没有需要归档的会话',
      });
    }

    const archivedIds = conversationsToArchive.map((c) => c.id);

    const result = await prisma.conversation.updateMany({
      where: {
        id: { in: archivedIds },
        deviceId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      archivedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      archivedConversations: conversationsToArchive,
    });
  } catch (e: unknown) {
    console.error('[POST /api/trash/auto-archive]', e);
    return NextResponse.json({ error: '自动归档失败' }, { status: 500 });
  }
}
