import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 获取存档列表（最近存档在前） */
export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const archivedConversations = await prisma.conversation.findMany({
    where: {
      deviceId,
      isDeleted: false,
      isArchived: true,
    },
    orderBy: [
      { archivedAt: 'desc' },
    ],
    select: {
      id: true,
      title: true,
      modelId: true,
      isPinned: true,
      pinnedAt: true,
      isArchived: true,
      archivedAt: true,
      orderIndex: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ 
    conversations: archivedConversations,
  });
}
