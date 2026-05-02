import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export interface EditHistoryEntry {
  id: string;
  action: 'rewrite' | 'expand' | 'translate' | 'manual';
  originalText: string;
  newText: string;
  timestamp: string;
  selectionStart?: number;
  selectionEnd?: number;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; clientMessageId: string }> }
) {
  const { id: conversationId, clientMessageId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }
  if (!conversationId) {
    return NextResponse.json({ error: '缺少对话 ID' }, { status: 400 });
  }
  if (!clientMessageId) {
    return NextResponse.json({ error: '缺少消息 ID' }, { status: 400 });
  }

  const body = await req.json();
  const { 
    newContent, 
    originalText, 
    newText, 
    action,
    selectionStart,
    selectionEnd,
  } = body as {
    newContent?: string;
    originalText?: string;
    newText?: string;
    action?: 'rewrite' | 'expand' | 'translate' | 'manual';
    selectionStart?: number;
    selectionEnd?: number;
  };

  if (newContent == null) {
    return NextResponse.json({ error: '缺少消息内容' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      deviceId,
      isDeleted: false,
    },
    select: { id: true, userId: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在或无权访问' }, { status: 404 });
  }

  const message = await prisma.message.findFirst({
    where: {
      conversationId,
      clientMessageId: decodeURIComponent(clientMessageId),
    },
  });

  if (!message) {
    return NextResponse.json({ error: '消息不存在' }, { status: 404 });
  }

  const originalContent = message.originalContent ?? message.content;

  let editHistory: EditHistoryEntry[] = [];
  if (message.editHistory) {
    try {
      const history = message.editHistory as unknown;
      if (Array.isArray(history)) {
        editHistory = history as EditHistoryEntry[];
      }
    } catch {
      // 如果解析失败，使用空数组
    }
  }

  if (originalText && newText && action) {
    const newEntry: EditHistoryEntry = {
      id: crypto.randomUUID(),
      action,
      originalText,
      newText,
      timestamp: new Date().toISOString(),
      selectionStart,
      selectionEnd,
    };
    editHistory.push(newEntry);
  }

  const updatedMessage = await prisma.message.update({
    where: { id: message.id },
    data: {
      content: newContent,
      originalContent: message.originalContent ?? message.content,
      editHistory: editHistory.length > 0 ? editHistory : message.editHistory,
    },
  });

  return NextResponse.json({
    success: true,
    message: {
      id: updatedMessage.clientMessageId ?? updatedMessage.id,
      role: updatedMessage.role,
      content: updatedMessage.content,
      originalContent: updatedMessage.originalContent,
      editHistory: updatedMessage.editHistory,
    },
  });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string; clientMessageId: string }> }
) {
  const { id: conversationId, clientMessageId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      deviceId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在或无权访问' }, { status: 404 });
  }

  const message = await prisma.message.findFirst({
    where: {
      conversationId,
      clientMessageId: decodeURIComponent(clientMessageId),
    },
    select: {
      id: true,
      content: true,
      originalContent: true,
      editHistory: true,
    },
  });

  if (!message) {
    return NextResponse.json({ error: '消息不存在' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: message.id,
      content: message.content,
      originalContent: message.originalContent,
      editHistory: message.editHistory,
      hasEdits: message.originalContent != null && message.editHistory != null,
    },
  });
}
