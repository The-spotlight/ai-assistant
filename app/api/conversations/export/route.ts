import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createZipFromConversations, conversationToMarkdown } from '@/lib/export';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const body = await req.json();
  const { ids } = body as { ids?: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '缺少 ids 参数' }, { status: 400 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      id: { in: ids },
      deviceId,
      isDeleted: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (conversations.length === 0) {
    return NextResponse.json({ error: '没有找到有效的会话' }, { status: 404 });
  }

  const zipBuffer = await createZipFromConversations(
    conversations.map((conv) => ({
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
    }))
  );

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `对话导出_${timestamp}.zip`;
  const sanitizedFilename = encodeURIComponent(filename);

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${sanitizedFilename}`,
    },
  });
}

export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      deviceId,
      isDeleted: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (conversations.length === 0) {
    return NextResponse.json({ error: '没有找到有效的会话' }, { status: 404 });
  }

  const zipBuffer = await createZipFromConversations(
    conversations.map((conv) => ({
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
    }))
  );

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `全部对话导出_${timestamp}.zip`;
  const sanitizedFilename = encodeURIComponent(filename);

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${sanitizedFilename}`,
    },
  });
}
