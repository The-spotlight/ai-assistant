import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isShareExpired } from '@/lib/share';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await ctx.params;

  try {
    const body = (await req.json()) as {
      nickname: string;
      content: string;
    };

    const { nickname, content } = body;

    if (!nickname || nickname.trim().length === 0) {
      return NextResponse.json(
        { error: '请输入昵称' },
        { status: 400 }
      );
    }

    if (nickname.length > 50) {
      return NextResponse.json(
        { error: '昵称不能超过50个字符' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '请输入评论内容' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: '评论内容不能超过1000个字符' },
        { status: 400 }
      );
    }

    const share = await prisma.share.findUnique({
      where: { shareId },
    });

    if (!share || share.isDeleted || isShareExpired(share.expiresAt)) {
      return NextResponse.json(
        { error: '分享链接不存在或已过期' },
        { status: 404 }
      );
    }

    if (share.hasPassword) {
      return NextResponse.json(
        { error: '此分享需要密码访问' },
        { status: 401 }
      );
    }

    const comment = await prisma.shareComment.create({
      data: {
        shareId,
        nickname: nickname.trim(),
        content: content.trim(),
      },
    });

    const comments = await prisma.shareComment.findMany({
      where: { shareId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        nickname: comment.nickname,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      },
      comments: comments.map((c) => ({
        id: c.id,
        nickname: c.nickname,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[POST /api/share/:shareId/comments]', e);
    return NextResponse.json(
      { error: '提交评论失败' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await ctx.params;

  try {
    const share = await prisma.share.findUnique({
      where: { shareId },
    });

    if (!share || share.isDeleted || isShareExpired(share.expiresAt)) {
      return NextResponse.json(
        { error: '分享链接不存在或已过期' },
        { status: 404 }
      );
    }

    if (share.hasPassword) {
      return NextResponse.json(
        { error: '此分享需要密码访问' },
        { status: 401 }
      );
    }

    const comments = await prisma.shareComment.findMany({
      where: { shareId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        nickname: c.nickname,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
      total: comments.length,
    });
  } catch (e) {
    console.error('[GET /api/share/:shareId/comments]', e);
    return NextResponse.json(
      { error: '获取评论失败' },
      { status: 500 }
    );
  }
}
