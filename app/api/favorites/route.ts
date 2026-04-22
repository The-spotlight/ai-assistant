import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

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
            content: true,
            role: true,
            createdAt: true,
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

    const formattedFavorites = favorites.map((fav) => ({
      id: fav.id,
      messageId: fav.messageId,
      conversationId: fav.conversationId,
      messageContent: fav.message.content,
      messageRole: fav.message.role,
      messageCreatedAt: fav.message.createdAt.toISOString(),
      conversationTitle: fav.conversation.title,
      createdAt: fav.createdAt.toISOString(),
    }));

    return NextResponse.json({ favorites: formattedFavorites });
  } catch (e) {
    console.error('[GET /api/favorites]', e);
    return NextResponse.json(
      { error: '获取收藏列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

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

    const existingFavorite = await prisma.favorite.findFirst({
      where: { messageId, deviceId },
    });

    if (existingFavorite) {
      return NextResponse.json({
        id: existingFavorite.id,
        messageId: existingFavorite.messageId,
        conversationId: existingFavorite.conversationId,
        createdAt: existingFavorite.createdAt.toISOString(),
        isNew: false,
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        messageId,
        conversationId,
        deviceId,
      },
    });

    return NextResponse.json({
      id: favorite.id,
      messageId: favorite.messageId,
      conversationId: favorite.conversationId,
      createdAt: favorite.createdAt.toISOString(),
      isNew: true,
    });
  } catch (e) {
    console.error('[POST /api/favorites]', e);
    return NextResponse.json(
      { error: '收藏消息失败' },
      { status: 500 }
    );
  }
}
