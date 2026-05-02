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

type ReplyToInfo = {
  messageId: string;
  content: string;
  createdAt: string;
  role: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const where = {
    userId,
    status: 'pending' as const,
    ...(conversationId ? { conversationId } : {}),
  };

  const scheduledMessages = await prisma.scheduledMessage.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      conversationId: true,
      content: true,
      scheduledAt: true,
      status: true,
      replyToId: true,
      replyToSnapshot: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ 
    scheduledMessages: scheduledMessages.map(msg => ({
      ...msg,
      scheduledAt: msg.scheduledAt.toISOString(),
      createdAt: msg.createdAt.toISOString(),
    }))
  });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { conversationId, content, scheduledAt, replyTo } = body as {
      conversationId: string;
      content: string;
      scheduledAt: string;
      replyTo?: ReplyToInfo | null;
    };

    if (!conversationId || !content || !scheduledAt) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true },
    });

    if (!conversation || conversation.userId !== userId) {
      return NextResponse.json({ error: '会话不存在或无权访问' }, { status: 404 });
    }

    const scheduledDateTime = new Date(scheduledAt);
    if (scheduledDateTime <= new Date()) {
      return NextResponse.json({ error: '定时时间必须在未来' }, { status: 400 });
    }

    let replyToId: string | null = null;
    let replyToSnapshot: string | null = null;

    if (replyTo) {
      const repliedMessage = await prisma.message.findFirst({
        where: {
          conversationId,
          OR: [
            { clientMessageId: replyTo.messageId },
            { id: replyTo.messageId },
          ],
        },
        select: { id: true, content: true, createdAt: true, role: true },
      });

      if (repliedMessage) {
        replyToId = repliedMessage.id;
        replyToSnapshot = JSON.stringify({
          content: repliedMessage.content.slice(0, 50) + (repliedMessage.content.length > 50 ? '...' : ''),
          createdAt: repliedMessage.createdAt.toISOString(),
          role: repliedMessage.role,
          isDeleted: false,
        });
      } else {
        replyToSnapshot = JSON.stringify({
          content: replyTo.content,
          createdAt: replyTo.createdAt,
          role: replyTo.role,
          isDeleted: true,
        });
      }
    }

    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        userId,
        conversationId,
        content: content.trim(),
        scheduledAt: scheduledDateTime,
        status: 'pending',
        ...(replyToId ? { replyToId } : {}),
        ...(replyToSnapshot ? { replyToSnapshot } : {}),
      },
    });

    return NextResponse.json({ 
      scheduledMessage: {
        ...scheduledMessage,
        scheduledAt: scheduledMessage.scheduledAt.toISOString(),
        createdAt: scheduledMessage.createdAt.toISOString(),
        updatedAt: scheduledMessage.updatedAt.toISOString(),
      }
    });
  } catch (e: unknown) {
    console.error('[POST /api/scheduled-messages]', e);
    return NextResponse.json({ error: '创建定时消息失败' }, { status: 500 });
  }
}
