import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 列出当前设备下的会话 */
export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { deviceId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      modelId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ conversations });
}

/** 新建空会话 */
export async function POST(req: Request) {
  let deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    try {
      const body = await req.json();
      if (typeof body?.deviceId === 'string') deviceId = body.deviceId;
    } catch {
      /* ignore */
    }
  }
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 deviceId 或 X-Device-Id' }, { status: 400 });
  }

  const c = await prisma.conversation.create({
    data: {
      deviceId,
      title: '新对话',
    },
  });

  return NextResponse.json({ id: c.id });
}
