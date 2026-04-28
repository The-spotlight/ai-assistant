import { NextRequest, NextResponse } from 'next/server';

const LOGIN_STATUS_KEY = 'ai_assistant_logged_in';

export function middleware(request: NextRequest) {
  const loginStatus = request.cookies.get(LOGIN_STATUS_KEY)?.value;
  const isLoggedIn = loginStatus === 'true';
  
  const { pathname } = request.nextUrl;
  
  if (pathname === '/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  
  if (!isLoggedIn && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
