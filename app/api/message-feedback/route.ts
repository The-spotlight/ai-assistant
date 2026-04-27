import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, conversationId, deviceId, liked, disliked, reason, comment } = body;

    if (!messageId || !conversationId || !deviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feedback = await prisma.messageFeedback.upsert({
      where: {
        messageId_deviceId: {
          messageId,
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
        messageId,
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
    if (error instanceof Error && error.message.includes('Foreign key constraint violated')) {
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

    await prisma.messageFeedback.delete({
      where: {
        messageId_deviceId: {
          messageId,
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