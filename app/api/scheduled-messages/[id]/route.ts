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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { scheduledAt, status } = body as {
      scheduledAt?: string;
      status?: 'pending' | 'sent' | 'cancelled';
    };

    const scheduledMessage = await prisma.scheduledMessage.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!scheduledMessage) {
      return NextResponse.json({ error: '定时消息不存在' }, { status: 404 });
    }

    if (scheduledMessage.userId !== userId) {
      return NextResponse.json({ error: '无权访问此定时消息' }, { status: 403 });
    }

    if (scheduledMessage.status !== 'pending') {
      return NextResponse.json({ error: '只能修改待发送的定时消息' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (scheduledAt) {
      const scheduledDateTime = new Date(scheduledAt);
      if (scheduledDateTime <= new Date()) {
        return NextResponse.json({ error: '定时时间必须在未来' }, { status: 400 });
      }
      updateData.scheduledAt = scheduledDateTime;
    }
    
    if (status === 'cancelled') {
      updateData.status = 'cancelled';
    }

    const updatedMessage = await prisma.scheduledMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      scheduledMessage: {
        ...updatedMessage,
        scheduledAt: updatedMessage.scheduledAt.toISOString(),
        createdAt: updatedMessage.createdAt.toISOString(),
        updatedAt: updatedMessage.updatedAt.toISOString(),
      }
    });
  } catch (e: unknown) {
    console.error('[PATCH /api/scheduled-messages/[id]]', e);
    return NextResponse.json({ error: '修改定时消息失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const scheduledMessage = await prisma.scheduledMessage.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!scheduledMessage) {
      return NextResponse.json({ error: '定时消息不存在' }, { status: 404 });
    }

    if (scheduledMessage.userId !== userId) {
      return NextResponse.json({ error: '无权访问此定时消息' }, { status: 403 });
    }

    if (scheduledMessage.status !== 'pending') {
      return NextResponse.json({ error: '只能取消待发送的定时消息' }, { status: 400 });
    }

    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('[DELETE /api/scheduled-messages/[id]]', e);
    return NextResponse.json({ error: '取消定时消息失败' }, { status: 500 });
  }
}
