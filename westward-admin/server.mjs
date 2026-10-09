import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getOrdersCol,
  getUsersCol,
  getProductsCol,
  getInquiriesCol,
  getBagCol,
  getWishlistCol,
  getSessionsCol,
  ensureIndexes,
} from './db.mjs';

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

// Global API Route Protection Middleware: Protects /api routes, with public/backend paths exempted
app.use('/api', (req, res, next) => {
  const publicPaths = ['/auth/pin', '/auth/check', '/auth/logout'];
  if (publicPaths.includes(req.path) || req.path.startsWith('/backend/')) {
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

  failedAttempts.delete(clientIp);

  res.cookie('ww_admin_token', ADMIN_SESSION_SECRET, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
// 2. DASHBOARD & ANALYTICS STATS (MONGODB AGGREGATIONS)
// ==========================================

app.get('/api/stats', requireAdminAuth, async (req, res) => {
  try {
    const ordersCol = await getOrdersCol();
    const usersCol = await getUsersCol();
    const inquiriesCol = await getInquiriesCol();

    const ordersStatsAgg = await ordersCol
      .aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
          },
        },
      ])
      .toArray();

    const ordersStats = ordersStatsAgg[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
    };

    const totalUsers = await usersCol.countDocuments();
    const totalInquiries = await inquiriesCol.countDocuments();
    const pendingInquiries = await inquiriesCol.countDocuments({
      $or: [{ status: 'new' }, { status: 'Received' }, { status: null }],
    });

    const statusBreakdownAgg = await ordersCol
      .aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const statusBreakdown = statusBreakdownAgg.reduce((acc, curr) => {
      acc[curr._id || 'Confirmed'] = curr.count;
      return acc;
    }, {});

    const recentOrdersRaw = await ordersCol
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const recentOrders = recentOrdersRaw.map(row => ({
      id: row.id,
      userId: row.userId,
      total: row.total,
      status: row.status,
      createdAt: row.createdAt,
      items: row.items || [],
      address: row.address || null,
    }));

    return res.json({
      totalRevenue: Number(ordersStats.totalRevenue || 0),
      totalOrders: Number(ordersStats.totalOrders || 0),
      avgOrderValue: Math.round(Number(ordersStats.avgOrderValue || 0)),
      totalUsers: Number(totalUsers || 0),
      totalInquiries: Number(totalInquiries || 0),
      pendingInquiries: Number(pendingInquiries || 0),
      statusBreakdown,
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
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && String(search).trim()) {
      const term = search.trim();
      filter.$or = [
        { id: { $regex: term, $options: 'i' } },
        { 'address.name': { $regex: term, $options: 'i' } },
        { 'address.email': { $regex: term, $options: 'i' } },
        { 'address.city': { $regex: term, $options: 'i' } },
      ];
    }

    const ordersCol = await getOrdersCol();
    const rows = await ordersCol.find(filter).sort({ createdAt: -1 }).toArray();

    const parsedOrders = rows.map(r => ({
      id: r.id,
      userId: r.userId,
      requestId: r.requestId,
      total: r.total,
      status: r.status,
      createdAt: r.createdAt,
      items: r.items || [],
      address: r.address || null,
    }));

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

    const ordersCol = await getOrdersCol();
    await ordersCol.updateOne({ id }, { $set: { status } });
    console.log(`[MongoDB SUCCESS] Updated order ${id} status to: ${status}`);

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
    const filter = {};

    if (search && String(search).trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const usersCol = await getUsersCol();
    const ordersCol = await getOrdersCol();

    const usersList = await usersCol.find(filter).sort({ createdAt: -1 }).toArray();

    const userOrdersAgg = await ordersCol
      .aggregate([
        {
          $group: {
            _id: '$userId',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$total' },
          },
        },
      ])
      .toArray();

    const statsMap = new Map(userOrdersAgg.map(u => [u._id, u]));

    const users = usersList.map(u => {
      const stats = statsMap.get(u.id) || { orderCount: 0, totalSpent: 0 };
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        created_at: u.createdAt,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
      };
    });

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
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    const productsCol = await getProductsCol();
    const rows = await productsCol.find(filter).sort({ id: 1 }).toArray();

    return res.json({ products: rows });
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

    const productsCol = await getProductsCol();
    const existing = await productsCol.findOne({ id });
    if (existing) {
      return res.status(409).json({ error: 'Product with this ID already exists.' });
    }

    await productsCol.insertOne({
      id,
      name,
      category,
      price: Number(price),
      color: color || 'Natural',
      sizes: sizes || ['S', 'M', 'L', 'XL'],
      description: description || '',
      image: image || '8350480',
      createdAt: new Date().toISOString(),
    });

    console.log(`[MongoDB SUCCESS] Added product ${id} (${name})`);
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

    const productsCol = await getProductsCol();
    await productsCol.updateOne(
      { id },
      {
        $set: {
          name,
          category,
          price: Number(price),
          color: color || 'Natural',
          sizes: sizes || ['S', 'M', 'L', 'XL'],
          description: description || '',
          image: image || '8350480',
          updatedAt: new Date().toISOString(),
        },
      }
    );

    console.log(`[MongoDB SUCCESS] Updated product ${id}`);
    return res.json({ ok: true, id });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const productsCol = await getProductsCol();
    await productsCol.deleteOne({ id });
    console.log(`[MongoDB SUCCESS] Deleted product ${id}`);
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
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const inquiriesCol = await getInquiriesCol();
    const inquiries = await inquiriesCol.find(filter).sort({ createdAt: -1 }).toArray();

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

    const inquiriesCol = await getInquiriesCol();
    await inquiriesCol.updateOne({ id }, { $set: { status } });
    console.log(`[MongoDB SUCCESS] Updated inquiry ${id} status to: ${status}`);

    return res.json({ ok: true, id, status });
  } catch (error) {
    console.error('Inquiry update error:', error);
    return res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// ==========================================
// 7. STOREFRONT BACKEND API (MONGODB UNIFIED ACCESS)
// ==========================================

app.get('/api/backend/products', async (req, res) => {
  try {
    const productsCol = await getProductsCol();
    const products = await productsCol.find({}).sort({ id: 1 }).toArray();
    return res.json({ products });
  } catch (err) {
    console.error('Backend products error:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/backend/store-data', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ bag: [], wishlist: [], orders: [] });

    const bagCol = await getBagCol();
    const wishlistCol = await getWishlistCol();
    const ordersCol = await getOrdersCol();

    const [bag, wishlist, orders] = await Promise.all([
      bagCol.find({ userId }).toArray(),
      wishlistCol.find({ userId }).toArray(),
      ordersCol.find({ userId }).sort({ createdAt: -1 }).limit(30).toArray(),
    ]);

    return res.json({
      bag: bag.map(b => ({ productId: b.productId, size: b.size, quantity: b.quantity })),
      wishlist: wishlist.map(w => w.productId),
      orders: orders.map(o => ({
        id: o.id,
        items: o.items || [],
        total: Number(o.total) || 0,
        address: o.address || null,
        status: o.status || 'Confirmed',
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error('Backend store-data error:', err);
    return res.status(500).json({ error: 'Failed to load store data' });
  }
});

app.post('/api/backend/bag', async (req, res) => {
  try {
    const { userId, productId, size, quantity } = req.body;
    const bagCol = await getBagCol();

    if (quantity <= 0) {
      await bagCol.deleteOne({ userId, productId, size });
    } else {
      await bagCol.updateOne(
        { userId, productId, size },
        { $set: { userId, productId, size, quantity } },
        { upsert: true }
      );
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Backend bag error:', err);
    return res.status(500).json({ error: 'Failed to update bag' });
  }
});

app.post('/api/backend/wishlist', async (req, res) => {
  try {
    const { userId, productId, saved } = req.body;
    const wishlistCol = await getWishlistCol();

    if (saved) {
      await wishlistCol.updateOne(
        { userId, productId },
        { $set: { userId, productId } },
        { upsert: true }
      );
    } else {
      await wishlistCol.deleteOne({ userId, productId });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Backend wishlist error:', err);
    return res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

app.post('/api/backend/orders', async (req, res) => {
  try {
    const { id, userId, requestId, items, total, address, status, createdAt } = req.body;
    const ordersCol = await getOrdersCol();
    const bagCol = await getBagCol();

    const prior = await ordersCol.findOne({ requestId, userId });
    if (prior) {
      return res.json({ order: prior });
    }

    const orderDoc = {
      id,
      userId,
      requestId,
      items,
      total,
      address,
      status: status || 'Confirmed',
      createdAt,
    };

    await ordersCol.insertOne(orderDoc);
    await bagCol.deleteMany({ userId });

    console.log(`[MongoDB SUCCESS] Registered customer order ${id} for ${userId} (₹${total})`);
    return res.json({ ok: true, order: orderDoc });
  } catch (err) {
    console.error('Backend order error:', err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/backend/auth/register', async (req, res) => {
  try {
    const { id, name, email, passwordHash, createdAt, sessionId, expiresAt } = req.body;
    const usersCol = await getUsersCol();
    const sessionsCol = await getSessionsCol();

    const existing = await usersCol.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    await usersCol.insertOne({ id, name, email, passwordHash, createdAt });
    await sessionsCol.insertOne({ id: sessionId, userId: id, createdAt, expiresAt });

    console.log(`[MongoDB SUCCESS] Registered new user in MongoDB: ${email} (${id})`);
    return res.status(201).json({ ok: true, user: { userId: id, displayName: name, email } });
  } catch (err) {
    console.error('Backend register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/backend/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    const usersCol = await getUsersCol();
    const user = await usersCol.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Backend login check error:', err);
    return res.status(500).json({ error: 'User check failed' });
  }
});

app.post('/api/backend/auth/session', async (req, res) => {
  try {
    const { sessionId, userId, createdAt, expiresAt } = req.body;
    const sessionsCol = await getSessionsCol();
    await sessionsCol.insertOne({ id: sessionId, userId, createdAt, expiresAt });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Backend session error:', err);
    return res.status(500).json({ error: 'Session creation failed' });
  }
});

app.get('/api/backend/auth/session', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.json({ user: null });

    const sessionsCol = await getSessionsCol();
    const usersCol = await getUsersCol();
    const nowIso = new Date().toISOString();

    const session = await sessionsCol.findOne({
      id: sessionId,
      expiresAt: { $gt: nowIso },
    });

    if (session && session.userId) {
      const user = await usersCol.findOne({ id: session.userId });
      if (user) {
        return res.json({
          user: {
            userId: user.id,
            displayName: user.name,
            email: user.email,
          },
        });
      }
    }
    return res.json({ user: null });
  } catch (err) {
    console.error('Backend session fetch error:', err);
    return res.json({ user: null });
  }
});

app.delete('/api/backend/auth/session', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (sessionId) {
      const sessionsCol = await getSessionsCol();
      await sessionsCol.deleteOne({ id: sessionId });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Backend session delete error:', err);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.post('/api/backend/contact', async (req, res) => {
  try {
    const inquiry = req.body;
    const inquiriesCol = await getInquiriesCol();
    await inquiriesCol.insertOne(inquiry);
    console.log(`[MongoDB SUCCESS] Customer inquiry recorded: ${inquiry.id}`);
    return res.status(201).json({ ok: true, id: inquiry.id });
  } catch (err) {
    console.error('Backend contact save error:', err);
    return res.status(500).json({ error: 'Failed to record inquiry' });
  }
});

app.get('/api/backend/contact', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ inquiries: [] });
    const inquiriesCol = await getInquiriesCol();
    const inquiries = await inquiriesCol.find({ userId }).sort({ createdAt: -1 }).limit(20).toArray();
    return res.json({ inquiries });
  } catch (err) {
    console.error('Backend contact fetch error:', err);
    return res.status(500).json({ error: 'Failed to load inquiries' });
  }
});

// ==========================================
// 8. VITE DEV SERVER / PRODUCTION SERVING
// ==========================================

async function startServer() {
  await ensureIndexes();
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
    console.log(`🍃  Connected DB:     MongoDB (${process.env.DB_NAME || 'westward_db'})`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
