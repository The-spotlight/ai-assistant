import { NextResponse } from 'next/server';
import { initServerTasks } from '@/app/init-tasks';

// 确保定时任务只启动一次
let tasksInitialized = false;

export async function GET() {
  if (!tasksInitialized) {
    try {
      initServerTasks();
      tasksInitialized = true;
      return NextResponse.json({ success: true, message: '定时任务已启动' });
    } catch (error) {
      console.error('启动定时任务失败:', error);
      return NextResponse.json({ error: '启动定时任务失败' }, { status: 500 });
    }
  }
  return NextResponse.json({ success: true, message: '定时任务已启动' });
}
