import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import {
  getMarketTemplates,
  getMarketTemplateCategories,
  DEFAULT_MARKET_TEMPLATES,
} from '@/lib/market-templates';

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const includeCategories = searchParams.get('includeCategories') === 'true';

  try {
    const templates = await getMarketTemplates({ category });

    if (includeCategories) {
      const categories = await getMarketTemplateCategories();
      return NextResponse.json({
        templates,
        categories,
      });
    }

    return NextResponse.json({ templates });
  } catch (e: unknown) {
    console.error('[GET /api/market-templates]', e);
    return NextResponse.json(
      { error: '获取市场模板列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!user || user.username !== 'admin') {
    return NextResponse.json(
      { error: '无权限执行此操作' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'sync-defaults') {
      const existingTemplates = await prisma.marketTemplate.findMany({
        select: { slug: true },
      });
      const existingSlugs = new Set(existingTemplates.map((t) => t.slug));

      const templatesToCreate = DEFAULT_MARKET_TEMPLATES.filter(
        (t) => !existingSlugs.has(t.slug)
      );

      if (templatesToCreate.length > 0) {
        await prisma.marketTemplate.createMany({
          data: templatesToCreate,
        });
      }

      return NextResponse.json({
        success: true,
        created: templatesToCreate.length,
        total: templatesToCreate.length + existingTemplates.length,
      });
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    );
  } catch (e: unknown) {
    console.error('[POST /api/market-templates]', e);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
