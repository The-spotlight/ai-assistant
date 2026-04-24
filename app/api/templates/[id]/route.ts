import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: templateId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const template = await prisma.template.findFirst({
      where: { id: templateId, deviceId },
    });
    if (!template) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, category, orderIndex } = body;

    const updateData: {
      title?: string;
      content?: string;
      category?: string;
      orderIndex?: number;
    } = {};

    if (title?.trim()) {
      updateData.title = title.trim();
    }
    if (content?.trim()) {
      updateData.content = content.trim();
    }
    if (category !== undefined) {
      updateData.category = category?.trim() || '其他';
    }
    if (orderIndex !== undefined) {
      updateData.orderIndex = orderIndex;
    }

    const updated = await prisma.template.update({
      where: { id: templateId },
      data: updateData,
    });

    return NextResponse.json({ id: updated.id });
  } catch (e: unknown) {
    console.error('[PATCH /api/templates/[id]]', e);
    return NextResponse.json({ error: '更新模板失败' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: templateId } = await ctx.params;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const template = await prisma.template.findFirst({
      where: { id: templateId, deviceId },
    });
    if (!template) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 });
    }

    await prisma.template.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('[DELETE /api/templates/[id]]', e);
    return NextResponse.json({ error: '删除模板失败' }, { status: 500 });
  }
}
