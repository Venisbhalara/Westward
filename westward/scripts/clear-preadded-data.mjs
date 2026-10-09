import { MongoClient } from 'mongodb';
import fs from 'node:fs';

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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/westward_db';
const DB_NAME = 'westward_db';

async function clearPreaddedData() {
  console.log('=====================================================');
  console.log('🧹 CLEARING PRE-ADDED USER DATA & DEMO ORDERS FROM MONGODB');
  console.log('=====================================================\n');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log(`1. Connected to MongoDB "${DB_NAME}"...`);

  // Count before
  const bOrders = await db.collection('orders').countDocuments();
  const bUsers = await db.collection('users').countDocuments();
  const bInq = await db.collection('contact_inquiries').countDocuments();
  const bBag = await db.collection('bag').countDocuments();
  const bWish = await db.collection('wishlist').countDocuments();
  const bSessions = await db.collection('sessions').countDocuments();
  const bProducts = await db.collection('products').countDocuments();

  console.log(`Pre-removal state in MongoDB:`);
  console.log(`- Orders: ${bOrders}`);
  console.log(`- Users: ${bUsers}`);
  console.log(`- Contact Inquiries: ${bInq}`);
  console.log(`- Bag items: ${bBag}`);
  console.log(`- Wishlist items: ${bWish}`);
  console.log(`- Sessions: ${bSessions}`);
  console.log(`- Products (to preserve): ${bProducts}`);

  // Delete pre-added userdata and demo orders (KEEP products intact!)
  await db.collection('orders').deleteMany({});
  await db.collection('users').deleteMany({});
  await db.collection('contact_inquiries').deleteMany({});
  await db.collection('bag').deleteMany({});
  await db.collection('wishlist').deleteMany({});
  await db.collection('sessions').deleteMany({});

  console.log('\n✔ Cleared MongoDB collections: orders, users, contact_inquiries, bag, wishlist, sessions');

  // Verify after
  const aOrders = await db.collection('orders').countDocuments();
  const aUsers = await db.collection('users').countDocuments();
  const aInq = await db.collection('contact_inquiries').countDocuments();
  const aBag = await db.collection('bag').countDocuments();
  const aWish = await db.collection('wishlist').countDocuments();
  const aProducts = await db.collection('products').countDocuments();

  console.log(`\nPost-removal state in MongoDB:`);
  console.log(`- Orders: ${aOrders}`);
  console.log(`- Users: ${aUsers}`);
  console.log(`- Contact Inquiries: ${aInq}`);
  console.log(`- Bag items: ${aBag}`);
  console.log(`- Wishlist items: ${aWish}`);
  console.log(`- Products preserved: ${aProducts}`);

  await client.close();
  console.log('\n=====================================================');
  console.log('✨ MONGODB CLEANUP COMPLETED SUCCESSFULLY');
  console.log('=====================================================\n');
}

clearPreaddedData().catch(console.error);
