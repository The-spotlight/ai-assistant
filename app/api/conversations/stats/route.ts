import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (!match) return null;
  
  try {
    const payload = await verifyJwt(match[1]);
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId, deviceId, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  const messageCounts: Record<string, number> = {};
  const conversationMap: Record<string, { id: string; title: string | null; createdAt: string; updatedAt: string }> = {};
  
  conversations.forEach((c) => {
    messageCounts[c.id] = c._count.messages;
    conversationMap[c.id] = {
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  const allMessages = await prisma.message.findMany({
    where: {
      conversation: {
        userId,
        deviceId,
        isDeleted: false,
      },
      replyToId: { not: null },
    },
    select: {
      id: true,
      conversationId: true,
      replyToId: true,
      replyToSnapshot: true,
    },
  });

  const crossConversationRelations: Array<{
    sourceConversationId: string;
    targetConversationId: string;
    type: 'reference' | 'branch' | 'merge';
    sourceMessageId: string;
    targetMessageId: string;
  }> = [];

  const repliedMessageIds = allMessages
    .filter((m) => m.replyToId)
    .map((m) => m.replyToId!);

  if (repliedMessageIds.length > 0) {
    const repliedMessages = await prisma.message.findMany({
      where: { id: { in: repliedMessageIds } },
      select: { id: true, conversationId: true },
    });

    const repliedMessageMap = new Map(repliedMessages.map((m) => [m.id, m.conversationId]));

    allMessages.forEach((msg) => {
      if (!msg.replyToId) return;
      
      const targetConvId = repliedMessageMap.get(msg.replyToId);
      if (!targetConvId) return;
      
      if (msg.conversationId !== targetConvId) {
        crossConversationRelations.push({
          sourceConversationId: msg.conversationId,
          targetConversationId: targetConvId,
          type: 'reference',
          sourceMessageId: msg.id,
          targetMessageId: msg.replyToId,
        });
      }
    });
  }

  return NextResponse.json({
    messageCounts,
    conversations: conversationMap,
    crossConversationRelations,
  });
}
