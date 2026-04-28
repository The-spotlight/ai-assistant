import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

export const runtime = 'nodejs';

function sha256(input: string): string {
  return require('crypto').createHash('sha256').update(input).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '请输入账号和密码' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: '用户名至少需要3个字符' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6个字符' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }

    const sha256Password = sha256(password);
    const passwordHash = await hash(sha256Password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}