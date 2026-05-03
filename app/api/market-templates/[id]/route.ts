import { NextResponse } from 'next/server';
import { getMarketTemplateById } from '@/lib/market-templates';

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

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await ctx.params;

    console.log('[GET /api/market-templates/[id]] 获取模板详情:', templateId);

    const template = await getMarketTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: '模板不存在或已下架',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (e: unknown) {
    console.error('[GET /api/market-templates/[id]] 错误:', e);

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
