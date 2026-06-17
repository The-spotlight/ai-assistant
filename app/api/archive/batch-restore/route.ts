import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 批量从存档恢复会话 */
export async function PATCH(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  let body: { ids: string[] } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
  }

  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: '缺少要恢复的会话 ID' }, { status: 400 });
  }

  const { ids } = body;

  await prisma.conversation.updateMany({
    where: {
      id: { in: ids },
      deviceId,
      isDeleted: false,
      isArchived: true,
    },
    data: {
      isArchived: false,
      archivedAt: null,
    },
  });

  return NextResponse.json({ success: true, restoredCount: ids.length });
}
