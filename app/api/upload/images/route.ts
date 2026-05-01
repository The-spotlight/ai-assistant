import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: '没有上传任何图片' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (files.length > 5) {
      return new Response(
        JSON.stringify({ error: '最多只能上传 5 张图片' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const uploadedImages: UploadedImage[] = [];
    const errors: string[] = [];

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat-images');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name} 格式不支持，请使用 jpg、png、gif 或 webp`);
        continue;
      }

      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`${file.name} 超过 ${MAX_SIZE_MB}MB 限制`);
        continue;
      }

      const fileId = randomUUID();
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${fileId}.${ext}`;
      const filepath = join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      uploadedImages.push({
        id: fileId,
        url: `/uploads/chat-images/${filename}`,
        filename: file.name,
        size: file.size,
        type: file.type,
      });
    }

    return new Response(
      JSON.stringify({
        success: uploadedImages.length > 0,
        images: uploadedImages,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[upload/images] 上传失败:', error);
    return new Response(
      JSON.stringify({ error: '图片上传失败，请重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}