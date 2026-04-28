import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';
import { signJwt } from '@/lib/jwt';
import { generateRefreshToken } from '@/lib/crypto';

export const runtime = 'nodejs';

function sha256(input: string): string {
  return require('crypto').createHash('sha256').update(input).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { username, password, rememberMe } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '请输入账号和密码' },
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

    let isPasswordValid = await compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      const sha256Password = sha256(password);
      isPasswordValid = await compare(sha256Password, user.passwordHash);
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '账号或密码错误' },
        { status: 401 }
      );
    }

    const token = await signJwt({ userId: user.id, username: user.username });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const sessionData: {
      userId: string;
      token: string;
      expiresAt: Date;
      refreshToken?: string;
      refreshExpiresAt?: Date;
    } = {
      userId: user.id,
      token,
      expiresAt,
    };

    let refreshToken: string | undefined;
    if (rememberMe) {
      refreshToken = generateRefreshToken();
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);
      sessionData.refreshToken = refreshToken;
      sessionData.refreshExpiresAt = refreshExpiresAt;
    }

    await prisma.session.create({
      data: sessionData,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
      refreshToken,
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