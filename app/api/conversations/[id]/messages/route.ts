import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: '缺少对话 ID' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      deviceId,
      isDeleted: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在' }, { status: 404 });
  }

  const messages = conversation.messages.map((m) => ({
    id: m.clientMessageId ?? m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json({ messages });
}
