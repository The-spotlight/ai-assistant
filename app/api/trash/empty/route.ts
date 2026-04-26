import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const deleted = await prisma.conversation.deleteMany({
    where: {
      deviceId,
      isDeleted: true,
    },
  });

  return NextResponse.json({ 
    success: true,
    deletedCount: deleted.count 
  });
}
