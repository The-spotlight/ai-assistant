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
    where: { deviceId, isDeleted: false },
    orderBy: [
      { isPinned: 'desc' },
      { pinnedAt: 'desc' },
      { updatedAt: 'desc' },
    ],
    select: {
      id: true,
      title: true,
      modelId: true,
      isPinned: true,
      pinnedAt: true,
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

  try {
    const c = await prisma.conversation.create({
      data: {
        deviceId,
        title: '新对话',
      },
    });

    return NextResponse.json({ id: c.id });
  } catch (e: unknown) {
    console.error('[POST /api/conversations]', e);
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === 'P2021') {
      return NextResponse.json(
        {
          error:
            '数据库表尚未创建：请在本地对当前 DATABASE_URL 执行 pnpm prisma db push（或 migrate deploy），并重新部署',
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: '创建会话失败：请确认 Vercel 环境变量 DATABASE_URL 已更新为新 Neon 库，且网络可访问' },
      { status: 500 }
    );
  }
}
