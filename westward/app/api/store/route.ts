import {NextRequest, NextResponse} from 'next/server';
import {database} from '@/db/store';
import {catalog, Product} from '@/lib/catalog';
import {getAuthUser, ensureAuthTables} from '@/lib/auth';
import {
  syncBagItemToMySQL,
  syncWishlistToMySQL,
  saveOrderToMySQL,
  clearBagInMySQL,
  getUserOrdersFromMySQL,
} from '@/lib/mysql';

export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {status, headers: {'Cache-Control': 'no-store'}});

let initialized = false;
async function ensureTables(db: ReturnType<typeof database>) {
  if (initialized) return;
  await ensureAuthTables(db);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bag (user_id text NOT NULL, product_id text NOT NULL, size text NOT NULL, quantity integer NOT NULL, PRIMARY KEY(user_id, product_id, size));
    CREATE TABLE IF NOT EXISTS orders (id text PRIMARY KEY NOT NULL, user_id text NOT NULL, request_id text NOT NULL, items text NOT NULL, total integer NOT NULL, address text NOT NULL, status text NOT NULL, created_at text NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS orders_request_id_unique ON orders (request_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at);
    CREATE TABLE IF NOT EXISTS products (id text PRIMARY KEY NOT NULL, data text NOT NULL);
    CREATE TABLE IF NOT EXISTS wishlist (user_id text NOT NULL, product_id text NOT NULL, PRIMARY KEY(user_id, product_id));
  `);
  initialized = true;
}

async function productList() {
  const db = database();
  await ensureTables(db);
  const rows = await db.prepare('SELECT id,data FROM products').all<{id: string; data: string}>();
  const existing = new Map(rows.results.map(row => [row.id, JSON.parse(row.data) as Product]));
  const missing = catalog.filter(
    product => JSON.stringify(existing.get(product.id)) !== JSON.stringify(product)
  );
  // Keep every statement below D1's bound-parameter limit; synchronize only new or changed catalog records.
  const statements = [];
  for (let i = 0; i < missing.length; i += 40) {
    const chunk = missing.slice(i, i + 40);
    statements.push(
      db
        .prepare(
          'INSERT INTO products (id,data) VALUES ' +
            chunk.map(() => '(?,?)').join(',') +
            ' ON CONFLICT(id) DO UPDATE SET data=excluded.data'
        )
        .bind(...chunk.flatMap(p => [p.id, JSON.stringify(p)]))
    );
  }
  if (statements.length) await db.batch(statements);
  // Catalog definitions own product content; customer bags and orders remain unchanged.
  return catalog;
}

export async function GET(req: NextRequest) {
  try {
    const products = await productList();
    const user = await getAuthUser(req);
    if (!user) return json({products, user: null, bag: [], wishlist: [], orders: []});
    const db = database();
    const [b, w, o] = await Promise.all([
      db.prepare('SELECT product_id AS productId,size,quantity FROM bag WHERE user_id=?').bind(user.userId).all(),
      db.prepare('SELECT product_id AS productId FROM wishlist WHERE user_id=?').bind(user.userId).all(),
      db
        .prepare('SELECT id,items,total,address,status,created_at AS createdAt FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 30')
        .bind(user.userId)
        .all(),
    ]);
    // Fetch live orders directly from MySQL westward_db (the unified source of truth)
    const mysqlOrders = await getUserOrdersFromMySQL(user.userId);
    let finalOrders = [];

    if (mysqlOrders && Array.isArray(mysqlOrders) && mysqlOrders.length > 0) {
      finalOrders = mysqlOrders.map(x => {
        let parsedItems = [];
        try {
          parsedItems = typeof x.items === 'string' ? JSON.parse(x.items) : (x.items || []);
        } catch {}
        let parsedAddress = null;
        try {
          parsedAddress = x.address ? (typeof x.address === 'string' ? JSON.parse(x.address) : x.address) : null;
        } catch {}

        // Keep local D1 database cache in sync with MySQL
        try {
          db.prepare('UPDATE orders SET status = ? WHERE id = ?')
            .bind(x.status, x.id)
            .run();
        } catch {}

        return {
          id: x.id,
          items: parsedItems,
          total: Number(x.total) || 0,
          address: parsedAddress,
          status: x.status || 'Confirmed',
          createdAt: x.createdAt,
        };
      });
    } else {
      finalOrders = (
        o.results as unknown as {
          id: string;
          items: string;
          total: number;
          address: string;
          status: string;
          createdAt: string;
        }[]
      ).map(x => ({
        ...x,
        items: JSON.parse(x.items),
        address: x.address ? (typeof x.address === 'string' ? JSON.parse(x.address) : x.address) : null,
        status: x.status === 'Demo — not charged' ? 'Confirmed' : (x.status || 'Confirmed'),
      }));
    }

    return json({
      products,
      user: {name: user.displayName, email: user.email},
      bag: b.results,
      wishlist: (w.results as unknown as {productId: string}[]).map(x => x.productId),
      orders: finalOrders,
    });
  } catch (e) {
    console.error(e);
    return json({error: 'The store could not be loaded. Please try again.'}, 503);
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) return json({error: 'Request not allowed'}, 403);
    const user = await getAuthUser(req);
    if (!user) return json({error: 'Sign in to save your bag and favourites.', signIn: true}, 401);
    const body = (await req.json()) as Record<string, unknown>;
    const db = database();
    const products = await productList();
    const p = products.find(x => x.id === body.productId);

    if (body.action === 'bag') {
      if (
        !p ||
        !p.sizes.includes(body.size as string) ||
        !Number.isInteger(body.quantity) ||
        (body.quantity as number) < 0 ||
        (body.quantity as number) > 10
      )
        return json({error: 'Choose a valid size and a quantity from 1 to 10.'}, 400);

      if (body.quantity === 0) {
        await db
          .prepare('DELETE FROM bag WHERE user_id=? AND product_id=? AND size=?')
          .bind(user.userId, p.id, body.size)
          .run();
      } else {
        await db
          .prepare(
            'INSERT INTO bag (user_id,product_id,size,quantity) VALUES (?,?,?,?) ON CONFLICT(user_id,product_id,size) DO UPDATE SET quantity=excluded.quantity'
          )
          .bind(user.userId, p.id, body.size, body.quantity)
          .run();
      }

      // Mirror to MySQL Workbench database
      await syncBagItemToMySQL({
        userId: user.userId,
        productId: p.id,
        size: body.size as string,
        quantity: body.quantity as number,
      });

      return json({ok: true});
    }

    if (body.action === 'wishlist') {
      if (!p || typeof body.saved !== 'boolean') return json({error: 'Invalid product'}, 400);
      await (body.saved
        ? db.prepare('INSERT OR IGNORE INTO wishlist (user_id,product_id) VALUES (?,?)')
        : db.prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?')
      )
        .bind(user.userId, p.id)
        .run();

      // Mirror to MySQL Workbench database
      await syncWishlistToMySQL({
        userId: user.userId,
        productId: p.id,
        saved: body.saved,
      });

      return json({ok: true});
    }

    if (body.action === 'checkout') {
      if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.requestId))
        return json({error: 'Invalid checkout request'}, 400);
      const prior = await db
        .prepare('SELECT id,total,items,address,status,created_at AS createdAt FROM orders WHERE request_id=? AND user_id=?')
        .bind(body.requestId, user.userId)
        .first<{id: string; total: number; items?: string; address?: string; status?: string; createdAt?: string}>();
      if (prior) {
        return json({
          id: prior.id,
          total: prior.total,
          items: prior.items ? JSON.parse(prior.items) : [],
          address: prior.address ? JSON.parse(prior.address) : null,
          status: prior.status === 'Demo — not charged' ? 'Confirmed' : (prior.status || 'Confirmed'),
          createdAt: prior.createdAt,
        });
      }
      const address = body.address as Record<string, string> | undefined;
      if (
        !address ||
        ['name', 'email', 'street', 'city', 'postal'].some(
          k => typeof address[k] !== 'string' || !address[k].trim() || address[k].length > 200
        ) ||
        !/^\S+@\S+\.\S+$/.test(address.email) ||
        !/^\d{6}$/.test(address.postal)
      )
        return json({error: 'Enter a complete Indian delivery address and valid email.'}, 400);
      const rows = await db
        .prepare('SELECT product_id AS productId,size,quantity FROM bag WHERE user_id=?')
        .bind(user.userId)
        .all<{productId: string; size: string; quantity: number}>();
      if (!rows.results.length) return json({error: 'Your bag is empty.'}, 400);
      const items = rows.results.map(row => {
        const product = products.find(p => p.id === row.productId);
        if (!product || !product.sizes.includes(row.size)) throw new Error('Product unavailable');
        return {...row, name: product.name, price: product.price, image: product.image};
      });
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const total = subtotal + (subtotal >= 7500 ? 0 : 199);
      const id = 'WW-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      const createdAt = new Date().toISOString();
      const orderAddress = {
        name: address.name,
        email: address.email,
        street: address.street,
        city: address.city,
        postal: address.postal,
        country: 'India',
      };

      await db.batch([
        db
          .prepare(
            'INSERT INTO orders (id,user_id,request_id,items,total,address,status,created_at) VALUES (?,?,?,?,?,?,?,?)'
          )
          .bind(
            id,
            user.userId,
            body.requestId,
            JSON.stringify(items),
            total,
            JSON.stringify(orderAddress),
            'Confirmed',
            createdAt
          ),
        db.prepare('DELETE FROM bag WHERE user_id=?').bind(user.userId),
      ]);

      // Mirror order & clear bag in MySQL Workbench database
      await saveOrderToMySQL({
        id,
        userId: user.userId,
        requestId: body.requestId as string,
        items,
        total,
        address: orderAddress,
        status: 'Confirmed',
        createdAt,
      });
      await clearBagInMySQL(user.userId);

      return json({
        id,
        total,
        items,
        address: orderAddress,
        status: 'Confirmed',
        createdAt,
      });
    }
    return json({error: 'Unknown action'}, 400);
  } catch (e) {
    console.error(e);
    return json({error: 'Your changes could not be saved. Please try again.'}, 503);
  }
}

