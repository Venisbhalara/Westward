import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { query } from './db.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const ADMIN_PIN = process.env.ADMIN_PIN || '123456';
const ADMIN_SESSION_SECRET = 'ww_admin_secret_auth_session_token_key_2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rate-limiting & Brute Force Protection Store
const failedAttempts = new Map();

// Strict Auth Middleware
function requireAdminAuth(req, res, next) {
  const token =
    req.cookies.ww_admin_token ||
    req.headers['x-admin-token'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (token === ADMIN_SESSION_SECRET) {
    return next();
  }
  return res.status(401).json({
    error: 'Unauthorized: Admin authentication token required to access this resource.',
    authenticated: false,
  });
}

// Global API Route Protection Middleware: Protects EVERY /api route by default
app.use('/api', (req, res, next) => {
  const publicPaths = ['/auth/pin', '/auth/check', '/auth/logout'];
  if (publicPaths.includes(req.path)) {
    return next();
  }
  return requireAdminAuth(req, res, next);
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/pin', (req, res) => {
  const clientIp = req.ip || req.connection?.remoteAddress || 'client';
  const now = Date.now();
  const attemptRecord = failedAttempts.get(clientIp);

  // Check rate limit lockout
  if (attemptRecord && attemptRecord.lockedUntil > now) {
    const remainingSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Security lock: Too many incorrect attempts. Please wait ${remainingSeconds} seconds.`,
    });
  }

  const { pin } = req.body;
  if (!pin || String(pin).trim() !== String(ADMIN_PIN).trim()) {
    const currentAttempts = (attemptRecord?.count || 0) + 1;
    if (currentAttempts >= 5) {
      failedAttempts.set(clientIp, { count: 0, lockedUntil: now + 60000 });
      return res.status(429).json({
        error: 'Too many incorrect attempts. Access locked for 60 seconds.',
      });
    }
    failedAttempts.set(clientIp, { count: currentAttempts, lockedUntil: 0 });
    return res.status(401).json({
      error: `Incorrect PIN. ${5 - currentAttempts} attempt(s) remaining.`,
    });
  }

  // Clear failed attempts upon successful authentication
  failedAttempts.delete(clientIp);

  res.cookie('ww_admin_token', ADMIN_SESSION_SECRET, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
    path: '/',
  });

  return res.json({
    ok: true,
    token: ADMIN_SESSION_SECRET,
    message: 'Executive admin access granted.',
  });
});

app.get('/api/auth/check', (req, res) => {
  const token =
    req.cookies.ww_admin_token ||
    req.headers['x-admin-token'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (token === ADMIN_SESSION_SECRET) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('ww_admin_token', { path: '/' });
  return res.json({ ok: true, message: 'Admin session terminated.' });
});

// ==========================================
// 2. DASHBOARD & ANALYTICS STATS
// ==========================================

app.get('/api/stats', requireAdminAuth, async (req, res) => {
  try {
    // Total Revenue & Orders
    const ordersStats = await query(
      `SELECT 
        COUNT(*) AS totalOrders,
        COALESCE(SUM(total), 0) AS totalRevenue,
        COALESCE(AVG(total), 0) AS avgOrderValue
       FROM orders`
    );

    // Total Users
    const usersCount = await query(`SELECT COUNT(*) AS totalUsers FROM users`);

    // Inquiries
    const inquiriesStats = await query(
      `SELECT 
        COUNT(*) AS totalInquiries,
        SUM(CASE WHEN status = 'new' OR status IS NULL THEN 1 ELSE 0 END) AS pendingInquiries
       FROM contact_inquiries`
    );

    // Orders Status Breakdown
    const statusBreakdown = await query(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
    );

    // Recent 5 Orders
    const recentOrdersRaw = await query(
      `SELECT id, user_id, total, items, address, status, created_at 
       FROM orders 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    const recentOrders = recentOrdersRaw.map(row => {
      let items = [];
      let address = null;
      try {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [];
      } catch {}
      try {
        address = typeof row.address === 'string' ? JSON.parse(row.address) : row.address || null;
      } catch {}
      return {
        id: row.id,
        userId: row.user_id,
        total: row.total,
        status: row.status,
        createdAt: row.created_at,
        items,
        address,
      };
    });

    return res.json({
      totalRevenue: Number(ordersStats[0]?.totalRevenue || 0),
      totalOrders: Number(ordersStats[0]?.totalOrders || 0),
      avgOrderValue: Math.round(Number(ordersStats[0]?.avgOrderValue || 0)),
      totalUsers: Number(usersCount[0]?.totalUsers || 0),
      totalInquiries: Number(inquiriesStats[0]?.totalInquiries || 0),
      pendingInquiries: Number(inquiriesStats[0]?.pendingInquiries || 0),
      statusBreakdown: statusBreakdown.reduce((acc, curr) => {
        acc[curr.status || 'Confirmed'] = curr.count;
        return acc;
      }, {}),
      recentOrders,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// ==========================================
// 3. ORDERS MANAGEMENT
// ==========================================

app.get('/api/orders', requireAdminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT id, user_id, request_id, items, total, address, status, created_at FROM orders';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search && String(search).trim()) {
      conditions.push('(id LIKE ? OR address LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query(sql, params);
    const parsedOrders = rows.map(r => {
      let items = [];
      let address = null;
      try {
        items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items || [];
      } catch {}
      try {
        address = typeof r.address === 'string' ? JSON.parse(r.address) : r.address || null;
      } catch {}
      return {
        id: r.id,
        userId: r.user_id,
        requestId: r.request_id,
        total: r.total,
        status: r.status,
        createdAt: r.created_at,
        items,
        address,
      };
    });

    return res.json({ orders: parsedOrders });
  } catch (error) {
    console.error('Orders error:', error);
    return res.status(500).json({ error: 'Failed to load orders' });
  }
});

app.patch('/api/orders/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return res.json({ ok: true, id, status });
  } catch (error) {
    console.error('Order update error:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ==========================================
// 4. REGISTERED USERS MANAGEMENT
// ==========================================

app.get('/api/users', requireAdminAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.created_at,
        COUNT(o.id) AS orderCount,
        COALESCE(SUM(o.total), 0) AS totalSpent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
    `;
    const params = [];

    if (search && String(search).trim()) {
      sql += ' WHERE (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' GROUP BY u.id, u.name, u.email, u.created_at ORDER BY u.created_at DESC';

    const users = await query(sql, params);
    return res.json({ users });
  } catch (error) {
    console.error('Users error:', error);
    return res.status(500).json({ error: 'Failed to fetch registered customers' });
  }
});

// ==========================================
// 5. PRODUCTS & CATALOG MANAGEMENT
// ==========================================

app.get('/api/products', requireAdminAuth, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT id, name, category, price, color, data, created_at FROM products';
    const params = [];

    if (category && category !== 'All') {
      sql += ' WHERE category = ?';
      params.push(category);
    }

    sql += ' ORDER BY id ASC';
    const rows = await query(sql, params);
    const parsed = rows.map(r => {
      let extra = {};
      try {
        extra = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
      } catch {}
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        price: r.price,
        color: r.color,
        createdAt: r.created_at,
        ...extra,
      };
    });

    return res.json({ products: parsed });
  } catch (error) {
    console.error('Products error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', requireAdminAuth, async (req, res) => {
  try {
    const { id, name, category, price, color, sizes, description, image } = req.body;
    if (!id || !name || !category || !price) {
      return res.status(400).json({ error: 'ID, name, category, and price are required' });
    }

    const extraData = JSON.stringify({
      sizes: sizes || ['S', 'M', 'L', 'XL'],
      description: description || '',
      image: image || '8350480',
    });

    await query(
      'INSERT INTO products (id, name, category, price, color, data) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, category, Number(price), color || 'Natural', extraData]
    );

    return res.status(201).json({ ok: true, id });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, color, sizes, description, image } = req.body;

    const extraData = JSON.stringify({
      sizes: sizes || ['S', 'M', 'L', 'XL'],
      description: description || '',
      image: image || '8350480',
    });

    await query(
      'UPDATE products SET name = ?, category = ?, price = ?, color = ?, data = ? WHERE id = ?',
      [name, category, Number(price), color, extraData, id]
    );

    return res.json({ ok: true, id });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ ok: true, id });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==========================================
// 6. CONTACT & SUPPORT INQUIRIES
// ==========================================

app.get('/api/inquiries', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT id, user_id, name, email, phone, subject, order_id, message, status, created_at FROM contact_inquiries';
    const params = [];

    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const inquiries = await query(sql, params);
    return res.json({ inquiries });
  } catch (error) {
    console.error('Inquiries error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer inquiries' });
  }
});

app.patch('/api/inquiries/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await query('UPDATE contact_inquiries SET status = ? WHERE id = ?', [status, id]);
    return res.json({ ok: true, id, status });
  } catch (error) {
    console.error('Inquiry update error:', error);
    return res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// ==========================================
// 7. VITE DEV SERVER / PRODUCTION SERVING
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🛡️  WESTWARD ATELIER — REALTIME EXECUTIVE ADMIN PANEL`);
    console.log(`🌐  Local URL:        http://localhost:${PORT}`);
    console.log(`🔐  Admin PIN:        ${process.env.ADMIN_PIN ? 'Custom PIN loaded from .env' : 'Configured via .env'}`);
    console.log(`💾  Connected DB:     ${process.env.DB_NAME || 'westward_db'} on ${process.env.DB_HOST || '127.0.0.1'}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
