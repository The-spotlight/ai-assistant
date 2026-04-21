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

function findAllMatches(content: string, searchTerm: string): Array<{ start: number; end: number }> {
  const matches: Array<{ start: number; end: number }> = [];
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  
  let start = 0;
  while (start < lowerContent.length) {
    const index = lowerContent.indexOf(lowerTerm, start);
    if (index === -1) break;
    matches.push({ start: index, end: index + searchTerm.length });
    start = index + searchTerm.length;
  }
  
  return matches;
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
    const conversations = await prisma.conversation.findMany({
      where: { deviceId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const results: SearchResult[] = [];

    for (const conv of conversations) {
      const titleMatches = conv.title ? findAllMatches(conv.title, trimmedTerm) : [];
      const hasTitleMatch = titleMatches.length > 0;
      
      const matchedMessages: MatchedMessage[] = [];
      
      for (const msg of conv.messages) {
        const msgMatches = findAllMatches(msg.content, trimmedTerm);
        if (msgMatches.length > 0) {
          const firstMatch = msgMatches[0];
          matchedMessages.push({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            matchStart: firstMatch.start,
            matchEnd: firstMatch.end,
            snippet: generateSnippet(msg.content, firstMatch.start, firstMatch.end),
          });
        }
      }

      if (hasTitleMatch || matchedMessages.length > 0) {
        results.push({
          conversationId: conv.id,
          conversationTitle: conv.title,
          updatedAt: conv.updatedAt.toISOString(),
          matchedMessages,
          titleMatch: hasTitleMatch,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (e: unknown) {
    console.error('[GET /api/search]', e);
    return NextResponse.json(
      { error: '搜索失败，请稍后重试' },
      { status: 500 }
    );
  }
}
