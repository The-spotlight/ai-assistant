import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { order: { id: string; orderIndex: number }[] };
    const { order } = body;

    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json({ error: '无效的排序数据' }, { status: 400 });
    }

    const conversationIds = order.map((item) => item.id);
    const existingConversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
        deviceId,
        isPinned: false,
        isDeleted: false,
      },
      select: { id: true },
    });

    const existingIds = new Set(existingConversations.map((c) => c.id));
    const validOrders = order.filter((item) => existingIds.has(item.id));

    for (const item of validOrders) {
      await prisma.conversation.update({
        where: { id: item.id },
        data: { orderIndex: item.orderIndex },
      });
    }

    return NextResponse.json({ success: true, updated: validOrders.length });
  } catch (e) {
    console.error('[POST /api/conversations/reorder]', e);
    return NextResponse.json({ error: '更新会话顺序失败' }, { status: 500 });
  }
}
