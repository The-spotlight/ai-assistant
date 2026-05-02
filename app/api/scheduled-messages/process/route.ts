import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: '此 API 只支持 POST 请求',
    docs: 'POST 请求用于触发定时消息处理，Vercel Cron 会定期调用此端点'
  }, { status: 405 });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const now = new Date();
    
    const pendingMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now },
      },
      include: {
        conversation: {
          select: {
            id: true,
            deviceId: true,
            modelId: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    if (pendingMessages.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: '没有到期的定时消息需要处理',
        processed: 0 
      });
    }

    console.log(`[ScheduledMessages] 找到 ${pendingMessages.length} 条到期的定时消息`);

    let processedCount = 0;
    let failedCount = 0;

    for (const scheduledMsg of pendingMessages) {
      try {
        await prisma.$transaction(async (tx) => {
          const userMessage = await tx.message.create({
            data: {
              userId: scheduledMsg.userId,
              conversationId: scheduledMsg.conversationId,
              role: 'user',
              content: scheduledMsg.content,
              clientMessageId: `scheduled_${scheduledMsg.id}`,
              ...(scheduledMsg.replyToId ? { replyToId: scheduledMsg.replyToId } : {}),
              ...(scheduledMsg.replyToSnapshot ? { replyToSnapshot: scheduledMsg.replyToSnapshot } : {}),
            },
          });

          await tx.scheduledMessage.update({
            where: { id: scheduledMsg.id },
            data: { status: 'sent' },
          });

          await tx.conversation.update({
            where: { id: scheduledMsg.conversationId },
            data: { updatedAt: new Date() },
          });

          return userMessage;
        });

        processedCount++;
        console.log(`[ScheduledMessages] 成功发送定时消息: ${scheduledMsg.id}`);
      } catch (error) {
        failedCount++;
        console.error(`[ScheduledMessages] 发送定时消息失败: ${scheduledMsg.id}`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `处理完成: 成功 ${processedCount} 条, 失败 ${failedCount} 条`,
      processed: processedCount,
      failed: failedCount,
      total: pendingMessages.length
    });

  } catch (e: unknown) {
    console.error('[POST /api/scheduled-messages/process]', e);
    return NextResponse.json({ error: '处理定时消息失败' }, { status: 500 });
  }
}
