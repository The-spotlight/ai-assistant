import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: '缺少 refresh token' },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: '无效的 refresh token' },
        { status: 401 }
      );
    }

    if (session.refreshExpiresAt && new Date() > session.refreshExpiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return NextResponse.json(
        { error: 'refresh token 已过期' },
        { status: 401 }
      );
    }

    const newToken = await signJwt({ userId: session.userId, username: session.user.username });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newToken,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: { id: session.user.id, username: session.user.username },
    });

    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}