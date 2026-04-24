import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const templates = await prisma.template.findMany({
    where: { deviceId },
    orderBy: [
      { orderIndex: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, content, category = '其他', orderIndex = 0 } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        deviceId,
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || '其他',
        orderIndex: orderIndex ?? 0,
      },
    });

    return NextResponse.json({ id: template.id });
  } catch (e: unknown) {
    console.error('[POST /api/templates]', e);
    return NextResponse.json({ error: '创建模板失败' }, { status: 500 });
  }
}
