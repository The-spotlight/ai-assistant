import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { hash } from 'bcryptjs';

require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log('=== 数据迁移脚本开始 ===');

  const defaultUsername = 'admin';
  const defaultPassword = '123456';

  let defaultUser = await prisma.user.findUnique({
    where: { username: defaultUsername },
  });

  if (!defaultUser) {
    console.log('创建默认用户...');
    const passwordHash = await hash(defaultPassword, 10);
    defaultUser = await prisma.user.create({
      data: {
        username: defaultUsername,
        passwordHash,
      },
    });
    console.log(`默认用户创建成功: ${defaultUser.id}`);
  } else {
    console.log(`默认用户已存在: ${defaultUser.id}`);
  }

  console.log('\n=== 数据迁移完成 ===');
  console.log(`默认用户: ${defaultUsername} / ${defaultPassword}`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });