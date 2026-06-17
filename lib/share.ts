import { prisma } from '@/lib/db';

const SHORT_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const SHORT_ID_LENGTH = 8;

/**
 * 生成随机短 ID
 */
export function generateShortId(): string {
  let result = '';
  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    result += SHORT_ID_CHARS.charAt(Math.floor(Math.random() * SHORT_ID_CHARS.length));
  }
  return result;
}

/**
 * 生成唯一的 shareId（确保不与数据库中已有的冲突）
 */
export async function generateUniqueShareId(): Promise<string> {
  let shareId: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    shareId = generateShortId();
    const existing = await prisma.share.findUnique({
      where: { shareId },
      select: { id: true },
    });
    if (!existing) {
      return shareId;
    }
    attempts++;
  }

  throw new Error('无法生成唯一的分享 ID，请稍后重试');
}

/**
 * 检查分享是否过期
 */
export function isShareExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}
