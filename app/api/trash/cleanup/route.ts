import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

const TRASH_RETENTION_DAYS = 7;

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - TRASH_RETENTION_DAYS);

  const result = await prisma.conversation.deleteMany({
    where: {
      isDeleted: true,
      deletedAt: { lt: cutoffDate },
    },
  });

  return NextResponse.json({ 
    success: true,
    deletedCount: result.count,
    cleanedUpBefore: cutoffDate.toISOString(),
  });
}
