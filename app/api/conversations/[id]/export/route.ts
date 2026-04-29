import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { conversationToMarkdown, conversationToCsv, ExportFormat } from '@/lib/export';

export const runtime = 'nodejs';

function getUtf8Bom(): Uint8Array {
  return new Uint8Array([0xEF, 0xBB, 0xBF]);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get('format') as ExportFormat) || 'markdown';

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

  const conversationData = {
    id: conv.id,
    title: conv.title,
    messages: conv.messages.map((m) => ({
      id: m.clientMessageId ?? m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      promptTokens: m.promptTokens ?? undefined,
      completionTokens: m.completionTokens ?? undefined,
      totalTokens: m.totalTokens ?? undefined,
    })),
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  };

  let content: string | Uint8Array;
  let contentType: string;
  let filename: string;

  if (format === 'csv') {
    const csvContent = conversationToCsv(conversationData);
    const bom = getUtf8Bom();
    const contentBuffer = new TextEncoder().encode(csvContent);
    const combined = new Uint8Array(bom.length + contentBuffer.length);
    combined.set(bom);
    combined.set(contentBuffer, bom.length);
    content = combined;
    contentType = 'text/csv; charset=utf-8';
    filename = `${conv.title?.trim() || '未命名对话'}.csv`;
  } else {
    content = conversationToMarkdown(conversationData);
    contentType = 'text/markdown; charset=utf-8';
    filename = `${conv.title?.trim() || '未命名对话'}.md`;
  }

  const sanitizedFilename = encodeURIComponent(filename.replace(/[<>:"/\\|?*]/g, '_'));

  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${sanitizedFilename}`,
    },
  });
}
