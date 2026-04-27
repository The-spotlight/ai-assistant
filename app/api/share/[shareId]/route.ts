import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isShareExpired } from '@/lib/share';

export const runtime = 'nodejs';

/**
 * 获取分享的会话内容（公开访问，无需登录）
 */
export async function GET(req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await ctx.params;

  try {
    // 查找分享记录
    const share = await prisma.share.findUnique({
      where: { shareId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: '分享链接不存在或已过期' },
        { status: 404 }
      );
    }

    // 检查是否已删除
    if (share.isDeleted) {
      return NextResponse.json(
        { error: '分享链接已被删除' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (isShareExpired(share.expiresAt)) {
      return NextResponse.json(
        { error: '分享链接已过期' },
        { status: 404 }
      );
    }

    // 检查是否有密码保护
    if (share.hasPassword) {
      // 这里可以实现密码验证逻辑
      // 目前简化处理：如果有密码，返回需要密码的提示
      // 实际实现中，应该从请求头或查询参数中获取密码并验证
      return NextResponse.json(
        { error: '此分享需要密码访问', requiresPassword: true },
        { status: 401 }
      );
    }

    // 检查关联的会话是否存在且未被删除
    if (!share.conversation || share.conversation.isDeleted) {
      return NextResponse.json(
        { error: '分享的会话已被删除' },
        { status: 404 }
      );
    }

    // 构建返回数据（只返回必要的信息，不包含敏感数据）
    const shareData = {
      shareId: share.shareId,
      title: share.title || share.conversation.title || '未命名对话',
      expiresAt: share.expiresAt?.toISOString() || null,
      createdAt: share.createdAt.toISOString(),
      conversation: {
        title: share.conversation.title,
        createdAt: share.conversation.createdAt.toISOString(),
        messages: share.conversation.messages.map((m) => ({
          id: m.clientMessageId ?? m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          toolInvocations: m.toolInvocations,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    };

    return NextResponse.json(shareData);
  } catch (e) {
    console.error('[GET /api/share/:shareId]', e);
    return NextResponse.json(
      { error: '获取分享内容失败' },
      { status: 500 }
    );
  }
}

/**
 * 验证分享密码（如果分享需要密码）
 */
export async function POST(req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await ctx.params;

  try {
    const body = (await req.json()) as { password?: string };
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: '请提供密码' },
        { status: 400 }
      );
    }

    // 查找分享记录
    const share = await prisma.share.findUnique({
      where: { shareId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: '分享链接不存在或已过期' },
        { status: 404 }
      );
    }

    // 检查是否已删除
    if (share.isDeleted) {
      return NextResponse.json(
        { error: '分享链接已被删除' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (isShareExpired(share.expiresAt)) {
      return NextResponse.json(
        { error: '分享链接已过期' },
        { status: 404 }
      );
    }

    // 检查是否需要密码
    if (!share.hasPassword || !share.passwordHash) {
      // 如果不需要密码，直接返回内容
      return GET(req, ctx);
    }

    // TODO: 实现密码验证
    // 这里需要使用 bcrypt 或类似的库来验证密码哈希
    // 目前简化处理，直接返回错误
    return NextResponse.json(
      { error: '密码验证功能暂未实现' },
      { status: 501 }
    );
  } catch (e) {
    console.error('[POST /api/share/:shareId]', e);
    return NextResponse.json(
      { error: '密码验证失败' },
      { status: 500 }
    );
  }
}
