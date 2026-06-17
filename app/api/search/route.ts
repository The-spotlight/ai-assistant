import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

type MatchedMessage = {
  id: string;
  role: string;
  content: string;
  matchStart: number;
  matchEnd: number;
  snippet: string;
};

type SearchResult = {
  conversationId: string;
  conversationTitle: string | null;
  updatedAt: string;
  matchedMessages: MatchedMessage[];
  titleMatch: boolean;
};

function generateSnippet(content: string, matchStart: number, matchEnd: number): string {
  const snippetLength = 150;
  const halfSnippet = snippetLength / 2;
  
  let start = Math.max(0, matchStart - halfSnippet);
  let end = Math.min(content.length, matchEnd + halfSnippet);
  
  let prefix = '';
  let suffix = '';
  
  if (start > 0) {
    prefix = '...';
    const nextSpace = content.indexOf(' ', start);
    if (nextSpace !== -1 && nextSpace < matchStart) {
      start = nextSpace + 1;
    }
  }
  
  if (end < content.length) {
    suffix = '...';
    const prevSpace = content.lastIndexOf(' ', end);
    if (prevSpace !== -1 && prevSpace > matchEnd) {
      end = prevSpace;
    }
  }
  
  return prefix + content.slice(start, end) + suffix;
}

function findFirstMatch(content: string, searchTerm: string): { start: number; end: number } | null {
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  
  const index = lowerContent.indexOf(lowerTerm);
  if (index === -1) return null;
  
  return { start: index, end: index + searchTerm.length };
}

export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('q');
  
  if (!searchTerm || searchTerm.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const trimmedTerm = searchTerm.trim();

  try {
    // 优化：分两步查询，只获取匹配的会话和消息
    // 1. 首先查找标题包含搜索词的会话
    const titleMatchedConversations = await prisma.conversation.findMany({
      where: {
        deviceId,
        title: {
          contains: trimmedTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    // 2. 查找内容包含搜索词的消息，并获取它们的会话
    // 同时搜索 content 和 replyToSnapshot 字段
    const contentMatchedMessages = await prisma.message.findMany({
      where: {
        conversation: {
          deviceId,
        },
        OR: [
          {
            content: {
              contains: trimmedTerm,
              mode: 'insensitive',
            },
          },
          {
            replyToSnapshot: {
              contains: trimmedTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },
        },
      },
    });

    // 3. 合并结果，按会话分组
    const resultsMap = new Map<string, SearchResult>();

    // 处理标题匹配的会话
    for (const conv of titleMatchedConversations) {
      if (!resultsMap.has(conv.id)) {
        resultsMap.set(conv.id, {
          conversationId: conv.id,
          conversationTitle: conv.title,
          updatedAt: conv.updatedAt.toISOString(),
          matchedMessages: [],
          titleMatch: true,
        });
      } else {
        // 如果已经存在（因为内容也匹配），标记为标题匹配
        const existing = resultsMap.get(conv.id)!;
        existing.titleMatch = true;
      }
    }

    // 处理内容匹配的消息
    for (const msg of contentMatchedMessages) {
      const convId = msg.conversationId;
      
      if (!resultsMap.has(convId)) {
        resultsMap.set(convId, {
          conversationId: convId,
          conversationTitle: msg.conversation.title,
          updatedAt: msg.conversation.updatedAt.toISOString(),
          matchedMessages: [],
          titleMatch: false,
        });
      }

      const result = resultsMap.get(convId)!;
      
      // 在内存中查找匹配位置（只处理匹配的消息，不是所有消息）
      // 同时检查 content 和 replyToSnapshot
      let match = findFirstMatch(msg.content, trimmedTerm);
      let isReplyMatch = false;
      
      if (!match && msg.replyToSnapshot) {
        // 如果在 content 中没找到，尝试在 replyToSnapshot 中查找
        // 需要解析 JSON 快照
        try {
          const snapshot = JSON.parse(msg.replyToSnapshot as string);
          const snapshotContent = snapshot.content || '';
          const snapshotMatch = findFirstMatch(snapshotContent, trimmedTerm);
          if (snapshotMatch) {
            // 创建一个包含引用内容的复合内容用于生成 snippet
            const displayContent = `[引用] ${snapshotContent}\n${msg.content}`;
            match = findFirstMatch(displayContent, trimmedTerm);
            isReplyMatch = true;
          }
        } catch {
          // 如果解析失败，直接在原始字符串中搜索
          match = findFirstMatch(msg.replyToSnapshot as string, trimmedTerm);
          isReplyMatch = true;
        }
      }
      
      if (match) {
        // 生成 snippet，如果是引用匹配，需要显示引用内容
        let snippet = '';
        if (isReplyMatch && msg.replyToSnapshot) {
          try {
            const snapshot = JSON.parse(msg.replyToSnapshot as string);
            const snapshotContent = snapshot.content || '';
            snippet = `[引用内容] ${snapshotContent}`;
          } catch {
            snippet = generateSnippet(msg.replyToSnapshot as string, match.start, match.end);
          }
        } else {
          snippet = generateSnippet(msg.content, match.start, match.end);
        }
        
        result.matchedMessages.push({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          matchStart: match.start,
          matchEnd: match.end,
          snippet,
        });
      }
    }

    // 4. 转换为数组并按更新时间排序
    const results = Array.from(resultsMap.values()).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({ results });
  } catch (e: unknown) {
    console.error('[GET /api/search]', e);
    return NextResponse.json(
      { error: '搜索失败，请稍后重试' },
      { status: 500 }
    );
  }
}
