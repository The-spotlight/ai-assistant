import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

function getUserIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (!match) return null;
  
  try {
    const payload = verifyJwt(match[1]);
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const templates = await prisma.template.findMany({
    where: { userId, deviceId },
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

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
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
        userId,
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