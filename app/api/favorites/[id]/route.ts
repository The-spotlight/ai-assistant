import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const result = await prisma.favorite.deleteMany({
      where: { id, deviceId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: '收藏不存在' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/favorites/:id]', e);
    return NextResponse.json(
      { error: '取消收藏失败' },
      { status: 500 }
    );
  }
}
