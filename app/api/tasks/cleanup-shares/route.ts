import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * 清理过期的回收区分享记录（7天前删除的记录）
 * 可以通过定时任务调用此 API 来保持数据库清洁
 */
export async function POST(req: Request) {
  try {
    // 计算7天前的时间
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 删除7天前已删除的分享记录
    const result = await prisma.share.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lte: sevenDaysAgo,
        },
      },
    });

    console.log(`[Cleanup Shares] 清理了 ${result.count} 条过期的回收区分享记录`);

    return NextResponse.json({
      success: true,
      message: `清理了 ${result.count} 条过期的回收区分享记录`,
      count: result.count,
    });
  } catch (e) {
    console.error('[Cleanup Shares] 清理过期分享记录失败:', e);
    return NextResponse.json(
      { error: '清理过期分享记录失败' },
      { status: 500 }
    );
  }
}

/**
 * 允许 GET 请求用于测试
 */
export async function GET(req: Request) {
  return POST(req);
}
