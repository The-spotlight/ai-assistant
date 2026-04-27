import { NextRequest, NextResponse } from 'next/server';
import { initServerTasks } from '@/app/init-tasks';

// 确保定时任务只启动一次
let tasksInitialized = false;

export function middleware(request: NextRequest) {
  // 只在第一次请求时初始化定时任务
  if (!tasksInitialized) {
    try {
      initServerTasks();
      tasksInitialized = true;
      console.log('定时任务已启动');
    } catch (error) {
      console.error('启动定时任务失败:', error);
    }
  }

  return NextResponse.next();
}

// 匹配所有请求
export const config = {
  matcher: '/',
};
