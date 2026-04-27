import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// 匹配所有请求
export const config = {
  matcher: '/',
};
