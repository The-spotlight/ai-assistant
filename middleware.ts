import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtEdge } from '@/lib/jwt-edge';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    if (token) {
      try {
        await verifyJwtEdge(token);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await verifyJwtEdge(token);
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