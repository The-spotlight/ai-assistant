import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, conversationId, deviceId, liked, disliked, reason, comment } = body;

    if (!messageId || !conversationId || !deviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 先尝试通过messageId查找消息，如果找不到，再尝试通过clientMessageId查找
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

    const feedback = await prisma.messageFeedback.upsert({
      where: {
        userId_messageId_deviceId: {
          userId: conversation.userId,
          messageId: message.id,
          deviceId,
        },
      },
      update: {
        liked,
        disliked,
        reason,
        comment,
      },
      create: {
        userId: conversation.userId,
        messageId: message.id,
        conversationId,
        deviceId,
        liked,
        disliked,
        reason,
        comment,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error creating/updating message feedback:', error);
    // 处理外键约束错误
    if (error instanceof Error && (error.message.includes('Foreign key constraint') || error.message.includes('The required connected records were not found'))) {
      return NextResponse.json({ error: 'Invalid message or conversation ID' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device ID' }, { status: 400 });
    }

    const feedbacks = await prisma.messageFeedback.findMany({
      where: {
        deviceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('Error getting message feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');
    const deviceId = request.headers.get('x-device-id');

    if (!messageId || !deviceId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 先尝试通过messageId查找消息，如果找不到，再尝试通过clientMessageId查找
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

    await prisma.messageFeedback.delete({
      where: {
        userId_messageId_deviceId: {
          userId: message.userId,
          messageId: message.id,
          deviceId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}