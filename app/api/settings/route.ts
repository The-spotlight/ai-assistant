import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/** 获取用户设置 */
export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const setting = await prisma.userSetting.findUnique({
      where: { deviceId },
    });

    return NextResponse.json({
      appearance: setting?.appearance,
      behavior: setting?.behavior,
      model: setting?.model,
      keyboardShortcuts: setting?.keyboardShortcuts,
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }
}

/** 保存用户设置 */
export async function POST(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { appearance, behavior, model, keyboardShortcuts } = body;

    const setting = await prisma.userSetting.upsert({
      where: { deviceId },
      create: {
        deviceId,
        appearance,
        behavior,
        model,
        keyboardShortcuts,
      },
      update: {
        appearance,
        behavior,
        model,
        keyboardShortcuts,
      },
    });

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json({ error: '保存设置失败' }, { status: 500 });
  }
}
