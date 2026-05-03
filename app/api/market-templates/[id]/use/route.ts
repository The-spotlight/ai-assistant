import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import { useMarketTemplate } from '@/lib/market-templates';

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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: marketTemplateId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');

  if (!deviceId) {
    return NextResponse.json(
      { error: '缺少 X-Device-Id' },
      { status: 400 }
    );
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const result = await useMarketTemplate({
      marketTemplateId,
      userId,
      deviceId,
    });

    return NextResponse.json({
      success: true,
      userTemplateId: result.userTemplateId,
      isFirstUse: result.isFirstUse,
      template: {
        id: result.marketTemplate.id,
        title: result.marketTemplate.title,
        category: result.marketTemplate.category,
      },
    });
  } catch (e: unknown) {
    console.error('[POST /api/market-templates/[id]/use]', e);

    if (e instanceof Error) {
      if (e.message === '模板不存在或已下架') {
        return NextResponse.json(
          { error: e.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: '使用模板失败，请稍后重试' },
      { status: 500 }
    );
  }
}
