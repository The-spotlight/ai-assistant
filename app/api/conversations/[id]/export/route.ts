import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { conversationToMarkdown } from '@/lib/export';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, deviceId, isDeleted: false },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  
  if (!conv) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 });
  }

  const markdown = conversationToMarkdown({
    id: conv.id,
    title: conv.title,
    messages: conv.messages.map((m) => ({
      id: m.clientMessageId ?? m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  });

  const filename = `${conv.title?.trim() || '未命名对话'}.md`;
  const sanitizedFilename = encodeURIComponent(filename.replace(/[<>:"/\\|?*]/g, '_'));

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${sanitizedFilename}`,
    },
  });
}
