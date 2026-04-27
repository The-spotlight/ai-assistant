import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createZipFromConversations, ExportFormat, ExportOptions } from '@/lib/export';

export const runtime = 'nodejs';

interface ExportRequest {
  ids?: string[];
  format?: ExportFormat;
  customTitle?: string;
  customNote?: string;
  includeMetadata?: boolean;
  selectedMessages?: Record<string, string[]>;
}

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const body = await req.json();
  const { ids, format = 'markdown', customTitle, customNote, includeMetadata = true, selectedMessages } = body as ExportRequest;

  // 确定要导出的对话
  let conversations;
  if (ids && Array.isArray(ids) && ids.length > 0) {
    // 导出指定对话
    conversations = await prisma.conversation.findMany({
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
  } else {
    // 导出全部对话
    conversations = await prisma.conversation.findMany({
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
  }

  if (conversations.length === 0) {
    return NextResponse.json({ error: '没有找到有效的会话' }, { status: 404 });
  }

  // 处理消息选择
  const exportConversations = conversations.map((conv) => {
    const conversationMessages = conv.messages.map((m) => ({
      id: m.clientMessageId ?? m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      id: conv.id,
      title: conv.title,
      messages: conversationMessages,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    };
  });

  // 准备导出选项
  const exportOptions: ExportOptions = {
    format,
    includeMetadata,
    customTitle,
    customNote,
  };

  const zipBuffer = await createZipFromConversations(exportConversations, exportOptions);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = ids && ids.length > 0 ? `对话导出_${timestamp}.zip` : `全部对话导出_${timestamp}.zip`;
  const sanitizedFilename = encodeURIComponent(filename);

  return new Response(Buffer.from(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${sanitizedFilename}`,
    },
  });
}

// 保留 GET 方法以保持向后兼容
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

  const exportConversations = conversations.map((conv) => ({
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
  }));

  const zipBuffer = await createZipFromConversations(exportConversations);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `全部对话导出_${timestamp}.zip`;
  const sanitizedFilename = encodeURIComponent(filename);

  return new Response(Buffer.from(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${sanitizedFilename}`,
    },
  });
}
