import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const body = await req.json();
  const { ids } = body as { ids?: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '缺少 ids 参数' }, { status: 400 });
  }

  const restored = await prisma.conversation.updateMany({
    where: {
      id: { in: ids },
      deviceId,
      isDeleted: true,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });

  return NextResponse.json({ count: restored.count });
}
