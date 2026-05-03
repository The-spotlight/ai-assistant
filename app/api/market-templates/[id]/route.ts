import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMarketTemplateById } from '@/lib/market-templates';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await ctx.params;

  try {
    const template = await getMarketTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: '模板不存在或已下架' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (e: unknown) {
    console.error('[GET /api/market-templates/[id]]', e);
    return NextResponse.json(
      { error: '获取模板详情失败' },
      { status: 500 }
    );
  }
}
