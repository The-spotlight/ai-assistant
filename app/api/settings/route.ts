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

/** 获取用户设置 */
export async function GET(req: Request) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return NextResponse.json({ error: '缺少 X-Device-Id' }, { status: 400 });
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const setting = await prisma.userSetting.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
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

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appearance, behavior, model, keyboardShortcuts } = body;

    const setting = await prisma.userSetting.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: {
        userId,
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