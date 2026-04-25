import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function prismaCode(e: unknown): string {
  if (typeof e !== 'object' || e === null) return '';
  if ('code' in e && typeof (e as { code: unknown }).code === 'string') {
    return (e as { code: string }).code;
  }
  return '';
}

export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          select: {
            id: true,
            clientMessageId: true,
            content: true,
            role: true,
            createdAt: true,
            replyToId: true,
            replyToSnapshot: true,
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const formattedFavorites = favorites.map((fav) => {
      const m = fav.message;
      return {
        id: fav.id,
        messageId: m ? (m.clientMessageId ?? m.id) : fav.messageId,
        conversationId: fav.conversationId,
        messageContent: m?.content ?? '',
        messageRole: m?.role ?? 'assistant',
        messageCreatedAt: m ? m.createdAt.toISOString() : fav.createdAt.toISOString(),
        conversationTitle: fav.conversation.title,
        createdAt: fav.createdAt.toISOString(),
        replyToId: m?.replyToId ?? null,
        replyToSnapshot: m?.replyToSnapshot ?? null,
      };
    });

    return NextResponse.json({ favorites: formattedFavorites });
  } catch (e) {
    console.error('[GET /api/favorites]', e);
    return NextResponse.json(
      { error: '获取收藏列表失败', detail: process.env.NODE_ENV !== 'production' ? String(e) : undefined },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  let rowMessageId = '';
  let displayMessageId = '';

  try {
    const body = (await req.json()) as {
      messageId: string;
      conversationId: string;
    };

    const { messageId, conversationId } = body;

    if (!messageId || !conversationId) {
      return NextResponse.json(
        { error: '缺少 messageId 或 conversationId' },
        { status: 400 }
      );
    }

    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, deviceId },
      select: { id: true },
    });
    if (!conv) {
      return NextResponse.json({ error: '会话不存在或无权访问' }, { status: 404 });
    }

    const message = await prisma.message.findFirst({
      where: {
        conversationId,
        OR: [{ id: messageId }, { clientMessageId: messageId }],
      },
      select: { id: true, clientMessageId: true },
    });
    if (!message) {
      return NextResponse.json(
        { error: '找不到该消息：请等回复生成完成后再收藏，或刷新页面后重试' },
        { status: 404 }
      );
    }

    rowMessageId = message.id;
    displayMessageId = message.clientMessageId ?? message.id;

    const existingFavorite = await prisma.favorite.findFirst({
      where: { messageId: rowMessageId, deviceId },
    });

    if (existingFavorite) {
      return NextResponse.json({
        id: existingFavorite.id,
        messageId: displayMessageId,
        conversationId: existingFavorite.conversationId,
        createdAt: existingFavorite.createdAt.toISOString(),
        isNew: false,
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        messageId: rowMessageId,
        conversationId,
        deviceId,
      },
    });

    return NextResponse.json({
      id: favorite.id,
      messageId: displayMessageId,
      conversationId: favorite.conversationId,
      createdAt: favorite.createdAt.toISOString(),
      isNew: true,
    });
  } catch (e) {
    console.error('[POST /api/favorites]', e);
    const code = prismaCode(e);
    if (code === 'P2002' && rowMessageId) {
      const existing = await prisma.favorite.findFirst({
        where: { messageId: rowMessageId, deviceId },
      });
      if (existing) {
        return NextResponse.json({
          id: existing.id,
          messageId: displayMessageId || rowMessageId,
          conversationId: existing.conversationId,
          createdAt: existing.createdAt.toISOString(),
          isNew: false,
        });
      }
      return NextResponse.json({ error: '该消息已收藏' }, { status: 409 });
    }
    if (code === 'P2003') {
      return NextResponse.json(
        { error: '消息或会话与数据库不一致，请刷新页面后重试' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: '收藏消息失败',
        detail: process.env.NODE_ENV !== 'production' ? String(e) : undefined,
      },
      { status: 500 }
    );
  }
}
