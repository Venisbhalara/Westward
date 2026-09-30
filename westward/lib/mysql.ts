import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'westward_db',
  disableEval: true,
};

/**
 * Execute a query with a dedicated, per-request MySQL connection.
 * Cloudflare Workers runtime (workerd) strictly forbids sharing I/O sockets across different requests.
 * Creating a per-call connection guarantees 100% reliability with zero cross-request socket reuse errors.
 */
async function withMySQL<T>(fn: (conn: mysql.Connection) => Promise<T>): Promise<T | null> {
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    return await fn(conn);
  } catch (err) {
    console.error('[MySQL Error]:', err);
    return null;
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {
        // ignore
      }
    }
  }
}

// ---------------- USER SYNC ---------------- //
export async function syncUserToMySQL(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}) {
  return withMySQL(async conn => {
    await conn.execute(
      `INSERT INTO users (id, name, email, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash)`,
      [user.id, user.name, user.email, user.passwordHash, user.createdAt]
    );
    console.log(`[MySQL SUCCESS] Synced user: ${user.email} (${user.id})`);
  });
}

// ---------------- SESSION SYNC ---------------- //
export async function syncSessionToMySQL(session: {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}) {
  return withMySQL(async conn => {
    await conn.execute(
      `INSERT INTO sessions (id, user_id, created_at, expires_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         expires_at = VALUES(expires_at)`,
      [session.id, session.userId, session.createdAt, session.expiresAt]
    );
    console.log(`[MySQL SUCCESS] Synced session: ${session.id} for user ${session.userId}`);
  });
}

export async function deleteSessionFromMySQL(sessionId: string) {
  return withMySQL(async conn => {
    await conn.execute(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
    console.log(`[MySQL SUCCESS] Deleted session: ${sessionId}`);
  });
}

// ---------------- BAG (CART) SYNC ---------------- //
export async function syncBagItemToMySQL(item: {
  userId: string;
  productId: string;
  size: string;
  quantity: number;
}) {
  return withMySQL(async conn => {
    if (item.quantity <= 0) {
      await conn.execute(
        `DELETE FROM bag WHERE user_id = ? AND product_id = ? AND size = ?`,
        [item.userId, item.productId, item.size]
      );
      console.log(`[MySQL SUCCESS] Removed bag item: ${item.productId} (${item.size}) for user ${item.userId}`);
    } else {
      await conn.execute(
        `INSERT INTO bag (user_id, product_id, size, quantity)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
        [item.userId, item.productId, item.size, item.quantity]
      );
      console.log(`[MySQL SUCCESS] Synced bag item: ${item.productId} (${item.size}, qty ${item.quantity}) for user ${item.userId}`);
    }
  });
}

export async function clearBagInMySQL(userId: string) {
  return withMySQL(async conn => {
    await conn.execute(`DELETE FROM bag WHERE user_id = ?`, [userId]);
    console.log(`[MySQL SUCCESS] Cleared bag for user ${userId}`);
  });
}

// ---------------- WISHLIST SYNC ---------------- //
export async function syncWishlistToMySQL(item: {
  userId: string;
  productId: string;
  saved: boolean;
}) {
  return withMySQL(async conn => {
    if (item.saved) {
      await conn.execute(
        `INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)`,
        [item.userId, item.productId]
      );
      console.log(`[MySQL SUCCESS] Added to wishlist: ${item.productId} for user ${item.userId}`);
    } else {
      await conn.execute(
        `DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`,
        [item.userId, item.productId]
      );
      console.log(`[MySQL SUCCESS] Removed from wishlist: ${item.productId} for user ${item.userId}`);
    }
  });
}

// ---------------- ORDERS SYNC ---------------- //
export async function saveOrderToMySQL(order: {
  id: string;
  userId: string;
  requestId: string;
  items: unknown;
  total: number;
  address: unknown;
  status: string;
  createdAt: string;
}) {
  return withMySQL(async conn => {
    const itemsJson = typeof order.items === 'string' ? order.items : JSON.stringify(order.items);
    const addressJson = typeof order.address === 'string' ? order.address : JSON.stringify(order.address);

    await conn.execute(
      `INSERT INTO orders (id, user_id, request_id, items, total, address, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [
        order.id,
        order.userId,
        String(order.requestId),
        itemsJson,
        Math.round(Number(order.total) || 0),
        addressJson,
        order.status,
        order.createdAt,
      ]
    );
    console.log(`[MySQL SUCCESS] Saved order: ${order.id} for user ${order.userId} (Total: ₹${order.total})`);
  });
}

export async function getUserOrdersFromMySQL(userId: string) {
  return withMySQL(async conn => {
    const [rows] = await conn.query(
      `SELECT id, user_id, request_id, items, total, address, status, created_at AS createdAt
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );
    return rows as Array<{
      id: string;
      user_id: string;
      request_id: string;
      items: string | unknown;
      total: number;
      address: string | unknown;
      status: string;
      createdAt: string;
    }>;
  });
}

// ---------------- CONTACT INQUIRIES SYNC ---------------- //
export async function saveContactInquiryToMySQL(inquiry: {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  orderId: string | null;
  message: string;
  status: string;
  createdAt: string;
}) {
  return withMySQL(async conn => {
    await conn.execute(
      `INSERT INTO contact_inquiries (id, user_id, name, email, phone, subject, order_id, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inquiry.id,
        inquiry.userId,
        inquiry.name,
        inquiry.email,
        inquiry.phone || null,
        inquiry.subject,
        inquiry.orderId || null,
        inquiry.message,
        inquiry.status,
        inquiry.createdAt,
      ]
    );
    console.log(`[MySQL SUCCESS] Saved contact inquiry: ${inquiry.id} from ${inquiry.email}`);
  });
}
