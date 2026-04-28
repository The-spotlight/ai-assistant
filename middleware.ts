import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { prisma } from '@/lib/db';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    if (token) {
      try {
        verifyJwt(token);
        const session = await prisma.session.findUnique({
          where: { token },
        });
        if (session && session.expiresAt > new Date()) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch {
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    verifyJwt(token);
    const session = await prisma.session.findUnique({
      where: { token },
    });
    
    if (!session || session.expiresAt <= new Date()) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('auth_token', '', { maxAge: 0 });
      return response;
    }
    
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { maxAge: 0 });
    return response;
  }
}

export const config = {
  matcher: ['/', '/login'],
};