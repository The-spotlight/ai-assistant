import { NextResponse } from 'next/server';
import { emojiCategories, searchEmojis, type EmojiCategory } from '@/lib/emoji-data';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (q && q.trim()) {
      const results = searchEmojis(q.trim());
      return NextResponse.json({
        success: true,
        data: results,
        total: results.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: emojiCategories as EmojiCategory[],
      total: emojiCategories.length,
    });
  } catch (e: unknown) {
    console.error('[GET /api/emojis]', e);
    return NextResponse.json(
      { success: false, error: '获取表情数据失败' },
      { status: 500 }
    );
  }
}
