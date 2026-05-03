import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import {
  getMarketTemplates,
  getMarketTemplateCategories,
  DEFAULT_MARKET_TEMPLATES,
} from '@/lib/market-templates';

export const runtime = 'nodejs';

function formatError(error: unknown): { message: string; details?: string } {
  if (error instanceof Error) {
    if ('code' in error && (error as { code: string }).code === 'P2021') {
      return {
        message: '数据库表不存在',
        details: '市场模板表尚未创建，请先运行数据库迁移：npm run db:migrate',
      };
    }
    if ('code' in error && (error as { code: string }).code === 'P1001') {
      return {
        message: '数据库连接失败',
        details: '无法连接到数据库，请检查数据库配置',
      };
    }
    return {
      message: error.message,
    };
  }
  return {
    message: String(error),
  };
}

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  try {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return null;

    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (!match) return null;

    const payload = await verifyJwt(match[1]);
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const includeCategories = searchParams.get('includeCategories') === 'true';

    console.log('[GET /api/market-templates] 请求参数:', { category, includeCategories });

    const templates = await getMarketTemplates({ category });

    console.log('[GET /api/market-templates] 获取到', templates.length, '个模板');

    if (includeCategories) {
      const categories = await getMarketTemplateCategories();
      return NextResponse.json({
        success: true,
        templates,
        categories,
      });
    }

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (e: unknown) {
    console.error('[GET /api/market-templates] 错误:', e);

    const formatted = formatError(e);

    return NextResponse.json(
      {
        success: false,
        error: formatted.message,
        details: formatted.details,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '未登录',
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!user || user.username !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: '无权限执行此操作',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'sync-defaults') {
      console.log('[POST /api/market-templates] 开始同步默认模板...');

      const existingTemplates = await prisma.marketTemplate.findMany({
        select: { slug: true },
      });
      const existingSlugs = new Set(existingTemplates.map((t) => t.slug));

      const templatesToCreate = DEFAULT_MARKET_TEMPLATES.filter(
        (t) => !existingSlugs.has(t.slug)
      );

      console.log('[POST /api/market-templates] 现有', existingTemplates.length, '个模板，需要创建', templatesToCreate.length, '个新模板');

      if (templatesToCreate.length > 0) {
        await prisma.marketTemplate.createMany({
          data: templatesToCreate,
        });
        console.log('[POST /api/market-templates] 成功创建', templatesToCreate.length, '个模板');
      }

      return NextResponse.json({
        success: true,
        created: templatesToCreate.length,
        total: templatesToCreate.length + existingTemplates.length,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: '无效的操作',
      },
      { status: 400 }
    );
  } catch (e: unknown) {
    console.error('[POST /api/market-templates] 错误:', e);

    const formatted = formatError(e);

    return NextResponse.json(
      {
        success: false,
        error: formatted.message,
        details: formatted.details,
      },
      { status: 500 }
    );
  }
}
