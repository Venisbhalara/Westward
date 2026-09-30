import mysql from 'mysql2/promise';

async function checkJourneyInMySQL() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'westward_db'
  });

  console.log('=== 1. USERS (Recent Registrations) ===');
  const [users] = await conn.execute('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5');
  console.table(users);

  console.log('\n=== 2. SESSIONS (Active Sessions) ===');
  const [sessions] = await conn.execute('SELECT id, user_id, expires_at FROM sessions ORDER BY created_at DESC LIMIT 5');
  console.table(sessions);

  console.log('\n=== 3. WISHLIST ===');
  const [wishlist] = await conn.execute('SELECT user_id, product_id, created_at FROM wishlist ORDER BY created_at DESC LIMIT 5');
  console.table(wishlist);

  console.log('\n=== 4. ORDERS (Recent Orders) ===');
  const [orders] = await conn.execute('SELECT id, user_id, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5');
  console.table(orders);

  console.log('\n=== 5. CONTACT_INQUIRIES (Concierge Inquiries) ===');
  const [inquiries] = await conn.execute('SELECT id, user_id, name, email, subject, order_id, status FROM contact_inquiries ORDER BY created_at DESC LIMIT 5');
  console.table(inquiries);

  console.log('\n=== 6. PRODUCTS (100 Catalog Items) ===');
  const [count] = await conn.execute('SELECT COUNT(*) as total FROM products');
  console.log('Total catalog products stored in MySQL:', count[0].total);

  await conn.end();
}
checkJourneyInMySQL().catch(console.error);
