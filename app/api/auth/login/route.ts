import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';
import { signJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

function sha256(input: string): string {
  return require('crypto').createHash('sha256').update(input).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { username, passwordHash } = await request.json();

    if (!username || !passwordHash) {
      return NextResponse.json(
        { error: '请输入账号和密码' },
        { status: 400 }
      );
    }

    if (passwordHash.length !== 64) {
      return NextResponse.json(
        { error: '无效的密码格式' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: '账号或密码错误' },
        { status: 401 }
      );
    }

    const serverPasswordHash = sha256(user.passwordHash);
    
    if (serverPasswordHash !== passwordHash) {
      return NextResponse.json(
        { error: '账号或密码错误' },
        { status: 401 }
      );
    }

    const token = await signJwt({ userId: user.id, username: user.username });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}