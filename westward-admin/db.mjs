import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/westward_db';
const DB_NAME = process.env.DB_NAME || 'westward_db';

let client = null;
let clientPromise = null;

export async function getClient() {
  if (client) return client;
  if (!clientPromise) {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client.connect().then(c => {
      console.log(`[Admin DB] Connected to MongoDB: ${DB_NAME}`);
      return c;
    });
  }
  return clientPromise;
}

export async function getDb() {
  const c = await getClient();
  return c.db(DB_NAME);
}

export async function getOrdersCol() {
  const db = await getDb();
  return db.collection('orders');
}

export async function getUsersCol() {
  const db = await getDb();
  return db.collection('users');
}

export async function getProductsCol() {
  const db = await getDb();
  return db.collection('products');
}

export async function getInquiriesCol() {
  const db = await getDb();
  return db.collection('contact_inquiries');
}

export async function getBagCol() {
  const db = await getDb();
  return db.collection('bag');
}

export async function getWishlistCol() {
  const db = await getDb();
  return db.collection('wishlist');
}

export async function getSessionsCol() {
  const db = await getDb();
  return db.collection('sessions');
}

export async function ensureIndexes() {
  try {
    const db = await getDb();
    await Promise.all([
      db.collection('users').createIndex({ id: 1 }, { unique: true }),
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('products').createIndex({ id: 1 }, { unique: true }),
      db.collection('orders').createIndex({ id: 1 }, { unique: true }),
      db.collection('orders').createIndex({ createdAt: -1 }),
      db.collection('contact_inquiries').createIndex({ id: 1 }, { unique: true }),
      db.collection('contact_inquiries').createIndex({ createdAt: -1 }),
    ]);
  } catch (err) {
    console.warn('[Admin DB Indexes Warning]:', err.message);
  }
}

export default {
  getClient,
  getDb,
  getOrdersCol,
  getUsersCol,
  getProductsCol,
  getInquiriesCol,
  getBagCol,
  getWishlistCol,
  getSessionsCol,
  ensureIndexes,
};
