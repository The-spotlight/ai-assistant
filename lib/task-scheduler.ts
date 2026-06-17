import cron from 'node-cron';

/**
 * 定时任务管理器
 * 用于管理和执行各种定时任务
 */
class TaskScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * 启动所有定时任务
   */
  startAllTasks() {
    this.startCleanupSharesTask();
  }

  /**
   * 停止所有定时任务
   */
  stopAllTasks() {
    this.tasks.forEach((task) => task.stop());
    this.tasks.clear();
  }

  /**
   * 启动清理过期分享记录的定时任务
   * 每天凌晨 2 点执行
   */
  private startCleanupSharesTask() {
    // 每天凌晨 2 点执行
    const task = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('[Task Scheduler] 执行清理过期分享记录任务');
        
        // 调用清理 API
        const response = await fetch('http://localhost:3000/api/tasks/cleanup-shares', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Task Scheduler] 清理任务执行成功:', data.message);
        } else {
          console.error('[Task Scheduler] 清理任务执行失败');
        }
      } catch (error) {
        console.error('[Task Scheduler] 清理任务执行出错:', error);
      }
    });

    this.tasks.set('cleanup-shares', task);
    console.log('[Task Scheduler] 清理过期分享记录任务已启动');
  }
}

// 导出单例实例
export const taskScheduler = new TaskScheduler();
