import { taskScheduler } from '@/lib/task-scheduler';

/**
 * 服务器端初始化函数
 * 用于启动定时任务等服务器端操作
 */
export function initServerTasks() {
  // 启动所有定时任务
  taskScheduler.startAllTasks();
  
  console.log('Server tasks initialized');
}
