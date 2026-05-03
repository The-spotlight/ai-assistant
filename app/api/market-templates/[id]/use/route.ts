import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { useMarketTemplate } from '@/lib/market-templates';

export const runtime = 'nodejs';

function formatError(error: unknown): { message: string; details?: string } {
  if (error instanceof Error) {
    if (error.message === '模板不存在或已下架') {
      return {
        message: error.message,
        details: '该模板可能已被移除或暂时不可用',
      };
    }
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: marketTemplateId } = await ctx.params;
    const deviceId = req.headers.get('x-device-id');

    console.log('[POST /api/market-templates/[id]/use] 开始使用模板:', {
      marketTemplateId,
      deviceId: deviceId ? '已提供' : '未提供',
    });

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少设备标识',
          details: '请求头中缺少 X-Device-Id',
        },
        { status: 400 }
      );
    }

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '未登录',
          details: '请先登录后再使用模板',
        },
        { status: 401 }
      );
    }

    const result = await useMarketTemplate({
      marketTemplateId,
      userId,
      deviceId,
    });

    console.log('[POST /api/market-templates/[id]/use] 成功:', {
      userTemplateId: result.userTemplateId,
      isFirstUse: result.isFirstUse,
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
    console.error('[POST /api/market-templates/[id]/use] 错误:', e);

    const formatted = formatError(e);

    if (e instanceof Error && e.message === '模板不存在或已下架') {
      return NextResponse.json(
        {
          success: false,
          error: formatted.message,
          details: formatted.details,
        },
        { status: 404 }
      );
    }

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
