import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
function loadEnv() {
  try {
    const content = fs.readFileSync('.env', 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  } catch {}
}
loadEnv();

async function clearPreaddedData() {
  console.log('=====================================================');
  console.log('🧹 CLEARING PRE-ADDED USER DATA & DEMO ORDERS');
  console.log('=====================================================\n');

  // 1. Clear MySQL westward_db tables
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'westward_db',
  });

  console.log('1. Connected to MySQL westward_db...');

  // Count before
  const [bOrders] = await conn.execute('SELECT COUNT(*) as c FROM orders');
  const [bUsers] = await conn.execute('SELECT COUNT(*) as c FROM users');
  const [bInq] = await conn.execute('SELECT COUNT(*) as c FROM contact_inquiries');
  const [bBag] = await conn.execute('SELECT COUNT(*) as c FROM bag');
  const [bWish] = await conn.execute('SELECT COUNT(*) as c FROM wishlist');
  const [bSessions] = await conn.execute('SELECT COUNT(*) as c FROM sessions');
  const [bProducts] = await conn.execute('SELECT COUNT(*) as c FROM products');

  console.log(`Pre-removal state in MySQL:`);
  console.log(`- Orders: ${bOrders[0].c}`);
  console.log(`- Users: ${bUsers[0].c}`);
  console.log(`- Contact Inquiries: ${bInq[0].c}`);
  console.log(`- Bag items: ${bBag[0].c}`);
  console.log(`- Wishlist items: ${bWish[0].c}`);
  console.log(`- Sessions: ${bSessions[0].c}`);
  console.log(`- Products (to preserve): ${bProducts[0].c}`);

  // Delete pre-added userdata and demo orders (KEEP products intact!)
  await conn.execute('DELETE FROM orders');
  await conn.execute('DELETE FROM users');
  await conn.execute('DELETE FROM contact_inquiries');
  await conn.execute('DELETE FROM bag');
  await conn.execute('DELETE FROM wishlist');
  await conn.execute('DELETE FROM sessions');

  console.log('\n✔ Cleared MySQL tables: orders, users, contact_inquiries, bag, wishlist, sessions');

  // Verify after
  const [aOrders] = await conn.execute('SELECT COUNT(*) as c FROM orders');
  const [aUsers] = await conn.execute('SELECT COUNT(*) as c FROM users');
  const [aInq] = await conn.execute('SELECT COUNT(*) as c FROM contact_inquiries');
  const [aBag] = await conn.execute('SELECT COUNT(*) as c FROM bag');
  const [aWish] = await conn.execute('SELECT COUNT(*) as c FROM wishlist');
  const [aProducts] = await conn.execute('SELECT COUNT(*) as c FROM products');

  console.log(`Post-removal state in MySQL:`);
  console.log(`- Orders: ${aOrders[0].c}`);
  console.log(`- Users: ${aUsers[0].c}`);
  console.log(`- Contact Inquiries: ${aInq[0].c}`);
  console.log(`- Bag items: ${aBag[0].c}`);
  console.log(`- Wishlist items: ${aWish[0].c}`);
  console.log(`- Products preserved: ${aProducts[0].c}`);

  await conn.end();

  // 2. Clear local D1 SQLite database
  const d1Dir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (fs.existsSync(d1Dir)) {
    const files = fs.readdirSync(d1Dir);
    const sqliteFile = files.find(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
    if (sqliteFile) {
      const fullSqlitePath = path.join(d1Dir, sqliteFile);
      console.log(`\n2. Found local D1 SQLite database: ${sqliteFile}`);
      try {
        const d1Db = new DatabaseSync(fullSqlitePath);
        const tables = d1Db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const tableNames = tables.map(t => t.name);

        for (const t of ['orders', 'users', 'contact_inquiries', 'bag', 'wishlist', 'sessions']) {
          if (tableNames.includes(t)) {
            d1Db.prepare(`DELETE FROM ${t}`).run();
            console.log(`✔ Cleared D1 table: ${t}`);
          }
        }
        d1Db.close();
      } catch (err) {
        console.warn('Note on D1 clear:', err.message);
      }
    }
  }

  console.log('\n=====================================================');
  console.log('✅ ALL PRE-ADDED USER DATA & DEMO ORDERS SUCCESSFULLY REMOVED!');
  console.log('✅ PRODUCTS & CATALOG PRESERVED 100% INTACT!');
  console.log('=====================================================');
}

clearPreaddedData().catch(console.error);
