import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

const TRASH_RETENTION_DAYS = 7;

/** 获取回收站列表（最近删除在前，7天后自动清理） */
export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - TRASH_RETENTION_DAYS);

  await prisma.conversation.deleteMany({
    where: {
      deviceId,
      isDeleted: true,
      deletedAt: { lt: cutoffDate },
    },
  });

  const trashedConversations = await prisma.conversation.findMany({
    where: {
      deviceId,
      isDeleted: true,
      deletedAt: { gte: cutoffDate },
    },
    orderBy: [
      { deletedAt: 'desc' },
    ],
    select: {
      id: true,
      title: true,
      modelId: true,
      isPinned: true,
      pinnedAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ 
    conversations: trashedConversations,
    retentionDays: TRASH_RETENTION_DAYS,
  });
}
