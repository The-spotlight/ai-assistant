import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createZipFromConversations, ExportFormat, ExportOptions, conversationsToCsv } from '@/lib/export';

export const runtime = 'nodejs';

interface ExportRequest {
  ids?: string[];
  format?: ExportFormat;
  customTitle?: string;
  customNote?: string;
  includeMetadata?: boolean;
  selectedMessages?: Record<string, string[]>;
}

function getUtf8Bom(): Uint8Array {
  return new Uint8Array([0xEF, 0xBB, 0xBF]);
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
      promptTokens: m.promptTokens ?? undefined,
      completionTokens: m.completionTokens ?? undefined,
      totalTokens: m.totalTokens ?? undefined,
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
    selectedMessageIds: selectedMessages ? Object.values(selectedMessages).flat() : undefined,
  };

  const timestamp = new Date().toISOString().slice(0, 10);
  
  // 对于 CSV 格式，如果是多条对话，直接返回带 BOM 的 CSV 文件
  if (format === 'csv' && exportConversations.length > 1) {
    const csvContent = conversationsToCsv(exportConversations, exportOptions);
    const bom = getUtf8Bom();
    const contentBuffer = new TextEncoder().encode(csvContent);
    const combined = new Uint8Array(bom.length + contentBuffer.length);
    combined.set(bom);
    combined.set(contentBuffer, bom.length);
    
    const filename = ids && ids.length > 0 ? `对话导出_${timestamp}.csv` : `全部对话导出_${timestamp}.csv`;
    const sanitizedFilename = encodeURIComponent(filename);
    
    return new Response(Buffer.from(combined), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${sanitizedFilename}`,
      },
    });
  }

  const zipBuffer = await createZipFromConversations(exportConversations, exportOptions);

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
