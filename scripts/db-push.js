#!/usr/bin/env node
const { execSync } = require('child_process');
const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

console.log('Connecting to database...');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function main() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    // Get current schema
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Current tables:', result.rows.map(r => r.table_name).join(', ') || '(none)');
    client.release();
    
    // Run prisma db push with direct connection
    console.log('\nRunning prisma db push...');
    execSync('node_modules/.bin/prisma db push --skip-generate', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: DATABASE_URL.replace('sslmode=require', 'sslmode=require&sslaccept=accept_invalid_certs'),
      },
    });
    
    console.log('\n✓ Schema synced successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
