import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, conversationId, deviceId, emoji } = body;

    if (!messageId || !conversationId || !deviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    let message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      message = await prisma.message.findFirst({
        where: { clientMessageId: messageId }
      });
    }

    if (!message) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        userId_messageId_deviceId: {
          userId: conversation.userId,
          messageId: message.id,
          deviceId,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        await prisma.messageReaction.delete({
          where: {
            userId_messageId_deviceId: {
              userId: conversation.userId,
              messageId: message.id,
              deviceId,
            },
          },
        });
        return NextResponse.json({ success: true, action: 'removed' });
      } else {
        const updatedReaction = await prisma.messageReaction.update({
          where: {
            userId_messageId_deviceId: {
              userId: conversation.userId,
              messageId: message.id,
              deviceId,
            },
          },
          data: {
            emoji,
          },
        });
        return NextResponse.json({ ...updatedReaction, action: 'updated' });
      }
    }

    const newReaction = await prisma.messageReaction.create({
      data: {
        userId: conversation.userId,
        messageId: message.id,
        conversationId,
        deviceId,
        emoji,
      },
    });

    return NextResponse.json({ ...newReaction, action: 'created' });
  } catch (error) {
    console.error('Error creating/updating message reaction:', error);
    if (error instanceof Error && (error.message.includes('Foreign key constraint') || error.message.includes('The required connected records were not found'))) {
      return NextResponse.json({ error: 'Invalid message or conversation ID' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');
    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');
    const conversationId = url.searchParams.get('conversationId');

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device ID' }, { status: 400 });
    }

    if (messageId) {
      let dbMessageId = messageId;
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true },
      });

      if (!message) {
        const altMessage = await prisma.message.findFirst({
          where: { clientMessageId: messageId },
          select: { id: true },
        });
        if (altMessage) {
          dbMessageId = altMessage.id;
        }
      }

      const reactions = await prisma.messageReaction.findMany({
        where: {
          messageId: dbMessageId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const aggregated = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = { count: 0, users: [] };
        }
        acc[reaction.emoji].count++;
        if (reaction.deviceId === deviceId) {
          acc[reaction.emoji].isMine = true;
        }
        return acc;
      }, {} as Record<string, { count: number; users: string[]; isMine?: boolean }>);

      const result = Object.entries(aggregated).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        isMine: data.isMine || false,
      }));

      return NextResponse.json(result);
    }

    if (conversationId) {
      const reactions = await prisma.messageReaction.findMany({
        where: {
          conversationId,
          deviceId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const byMessage: Record<string, { emoji: string; isMine: boolean }> = {};
      reactions.forEach((reaction) => {
        byMessage[reaction.messageId] = {
          emoji: reaction.emoji,
          isMine: true,
        };
      });

      return NextResponse.json(byMessage);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error getting message reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
