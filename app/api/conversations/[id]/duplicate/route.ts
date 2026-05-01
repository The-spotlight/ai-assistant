import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (!match) return null;
  
  try {
    const payload = await verifyJwt(match[1]);
    return payload.userId;
  } catch {
    return null;
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: sourceConversationId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }
  
  if (!sourceConversationId) {
    return NextResponse.json({ error: '缺少对话 ID' }, { status: 400 });
  }
  
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const sourceConversation = await prisma.conversation.findFirst({
      where: {
        id: sourceConversationId,
        deviceId,
        userId,
        isDeleted: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!sourceConversation) {
      return NextResponse.json({ error: '源对话不存在' }, { status: 404 });
    }

    const originalTitle = sourceConversation.title?.trim() || '新对话';
    const newTitle = `${originalTitle}（副本）`;

    const newConversation = await prisma.conversation.create({
      data: {
        userId,
        deviceId,
        title: newTitle,
        modelId: sourceConversation.modelId,
      },
    });

    if (sourceConversation.messages.length > 0) {
      const oldIdToNewId = new Map<string, string>();
      const newMessages = [];

      for (const sourceMessage of sourceConversation.messages) {
        const newClientMessageId = `dup_${sourceMessage.id}_${Date.now()}`;
        newMessages.push({
          userId,
          conversationId: newConversation.id,
          role: sourceMessage.role,
          content: sourceMessage.content,
          ...(sourceMessage.toolInvocations != null ? { toolInvocations: sourceMessage.toolInvocations as object } : {}),
          clientMessageId: newClientMessageId,
          promptTokens: sourceMessage.promptTokens,
          completionTokens: sourceMessage.completionTokens,
          totalTokens: sourceMessage.totalTokens,
          replyToId: sourceMessage.replyToId ? oldIdToNewId.get(sourceMessage.replyToId) : null,
          replyToSnapshot: sourceMessage.replyToSnapshot,
          createdAt: sourceMessage.createdAt,
        });
        oldIdToNewId.set(sourceMessage.id, newClientMessageId);
      }

      await prisma.message.createMany({
        data: newMessages,
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId, deviceId, isDeleted: false },
      orderBy: [
        { isPinned: 'desc' },
        { pinnedAt: 'desc' },
        { orderIndex: 'asc' },
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        modelId: true,
        isPinned: true,
        pinnedAt: true,
        orderIndex: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      id: newConversation.id,
      title: newTitle,
      conversations,
    });
  } catch (e: unknown) {
    console.error('[POST /api/conversations/:id/duplicate]', e);
    return NextResponse.json(
      { error: '复制对话失败' },
      { status: 500 }
    );
  }
}
