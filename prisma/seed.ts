import { PrismaClient } from '@prisma/client';
import { DEFAULT_MARKET_TEMPLATES } from '@/lib/market-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 开始数据库种子...');

  console.log('\n📋 同步市场模板数据...');
  const existingTemplates = await prisma.marketTemplate.findMany({
    select: { slug: true, id: true },
  });
  const existingSlugs = new Set(existingTemplates.map((t) => t.slug));

  const templatesToCreate = DEFAULT_MARKET_TEMPLATES.filter(
    (t) => !existingSlugs.has(t.slug)
  );

  if (templatesToCreate.length > 0) {
    console.log(`  - 发现 ${templatesToCreate.length} 个新模板需要创建`);
    await prisma.marketTemplate.createMany({
      data: templatesToCreate,
    });
    console.log(`  ✓ 已创建 ${templatesToCreate.length} 个市场模板`);
  } else {
    console.log('  ✓ 市场模板已是最新，无需更新');
  }

  const allTemplates = await prisma.marketTemplate.findMany({
    select: { slug: true, title: true, isActive: true },
  });
  console.log(`\n📊 当前市场模板总数: ${allTemplates.length}`);
  allTemplates.forEach((t) => {
    console.log(`  - ${t.title} (${t.slug}) [${t.isActive ? '启用' : '禁用'}]`);
  });

  console.log('\n✅ 种子数据同步完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
