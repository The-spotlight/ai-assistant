import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('cookie');
    if (!authHeader) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const cookieMatch = authHeader.match(/auth_token=([^;]+)/);
    if (!cookieMatch) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const token = cookieMatch[1];
    
    const payload = await verifyJwt(token);
    
    const session = await prisma.session.findUnique({
      where: { token },
    });
    
    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json({ error: '会话已过期' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
}