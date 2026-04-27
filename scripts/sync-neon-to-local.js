const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_sTqN2AFOK7er@ep-gentle-forest-amreuoxa.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require';
const LOCAL_URL = 'postgresql://postgres:postgres@localhost:5432/ai_assistant';

const TABLE_ORDER = [
  'Conversation',
  'Message',
  'Favorite',
  'Template',
  'Share',
  'ShareView',
  'UserSetting',
];

async function connectWithRetry(url, opts, label) {
  for (let i = 1; i <= 3; i++) {
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 60000, ...opts });
    try {
      await client.connect();
      await client.query('SELECT 1');
      console.log(`✓ 已连接 ${label}`);
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      console.log(`  ${label} 第 ${i} 次连接失败: ${err.message}`);
      if (i < 3) {
        console.log(`  等待 5s 后重试...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
  throw new Error(`无法连接 ${label}`);
}

// 获取表的字段类型
async function getColumnTypes(client, tablename) {
  const res = await client.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
  `, [tablename]);
  const types = {};
  for (const row of res.rows) {
    types[row.column_name] = row.data_type === 'USER-DEFINED' ? row.udt_name : row.data_type;
  }
  return types;
}

function coerceValue(value, pgType) {
  if (value === null || value === undefined) return null;

  // JSON 字段统一序列化成合法 JSON 文本，插入时显式 ::jsonb
  if (pgType === 'json' || pgType === 'jsonb') {
    try {
      if (typeof value === 'string') {
        // 已是 JSON 文本则规范化；否则当作普通字符串值
        try {
          return JSON.stringify(JSON.parse(value));
        } catch {
          return JSON.stringify(value);
        }
      }
      return JSON.stringify(value);
    } catch {
      return 'null';
    }
  }

  return value;
}

async function sync() {
  let neonClient, localClient;
  try {
    neonClient = await connectWithRetry(NEON_URL, { ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 }, 'Neon');
    localClient = await connectWithRetry(LOCAL_URL, {}, 'Local');

    const res = await neonClient.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
    const existing = new Set(res.rows.map(r => r.tablename));
    const toSync = TABLE_ORDER.filter(t => existing.has(t));

    console.log(`\n清空本地表（逆序）...`);
    for (const t of [...toSync].reverse()) {
      await localClient.query(`TRUNCATE TABLE "${t}" CASCADE`);
    }
    console.log(`  ✓ 已清空所有表`);

    for (const tablename of toSync) {
      console.log(`\n同步表: ${tablename}`);
      const data = await neonClient.query(`SELECT * FROM "${tablename}"`);
      console.log(`  - ${data.rows.length} 条记录`);
      if (data.rows.length === 0) continue;

      // 获取本地表的字段类型
      const colTypes = await getColumnTypes(localClient, tablename);
      const columns = Object.keys(data.rows[0]);
      const columnList = columns.map(c => `"${c}"`).join(', ');

      const jsonCols = columns.filter(c => colTypes[c] === 'json' || colTypes[c] === 'jsonb');

      let inserted = 0;
      for (const row of data.rows) {
        const values = columns.map(c => coerceValue(row[c], colTypes[c]));
        const placeholders = columns
          .map((c, idx) => (jsonCols.includes(c) ? `$${idx + 1}::jsonb` : `$${idx + 1}`))
          .join(', ');

        try {
          await localClient.query(
            `INSERT INTO "${tablename}" (${columnList}) VALUES (${placeholders})`,
            values
          );
          inserted++;
        } catch (err) {
          console.error(`  ⚠ 插入失败 (table=${tablename}, id=${row.id}): ${err.message}`);
        }
      }
      console.log(`  ✓ 已同步 ${inserted}/${data.rows.length} 条`);
    }

    console.log('\n✅ 同步完成');
  } catch (err) {
    console.error('❌ 同步失败:', err.message);
    process.exit(1);
  } finally {
    if (neonClient) await neonClient.end().catch(() => {});
    if (localClient) await localClient.end().catch(() => {});
  }
}

sync();
