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

export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { templates } = body;

    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return NextResponse.json({ error: '没有有效的模板数据' }, { status: 400 });
    }

    const existingTemplates = await prisma.template.findMany({
      where: { userId, deviceId },
      select: { title: true },
    });

    const existingTitles = new Set(existingTemplates.map((t) => t.title.toLowerCase()));

    const createdIds: string[] = [];
    const titleMappings: { original: string; imported: string }[] = [];

    for (const template of templates) {
      const { title, content, category } = template;

      if (!title?.trim() || !content?.trim()) {
        continue;
      }

      let uniqueTitle = title.trim();
      let counter = 1;
      const originalTitle = uniqueTitle;

      while (existingTitles.has(uniqueTitle.toLowerCase())) {
        uniqueTitle = `${originalTitle}(${counter})`;
        counter++;
      }

      const newTemplate = await prisma.template.create({
        data: {
          userId,
          deviceId,
          title: uniqueTitle,
          content: content.trim(),
          category: category?.trim() || '其他',
          orderIndex: 0,
        },
      });

      createdIds.push(newTemplate.id);
      existingTitles.add(uniqueTitle.toLowerCase());

      if (originalTitle !== uniqueTitle) {
        titleMappings.push({ original: originalTitle, imported: uniqueTitle });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: createdIds.length,
      ids: createdIds,
      titleMappings 
    });
  } catch (e: unknown) {
    console.error('[POST /api/templates/batch-import]', e);
    return NextResponse.json({ error: '批量导入模板失败' }, { status: 500 });
  }
}
