import { NextRequest, NextResponse } from 'next/server';
import { catalog, Product } from '@/lib/catalog';
import { getAuthUser } from '@/lib/auth';
import {
  fetchCatalogFromMongoDB,
  fetchUserStoreDataFromMongoDB,
  syncBagItemToMongoDB,
  syncWishlistToMongoDB,
  createOrderInMongoDB,
} from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });

async function getStoreCatalog(): Promise<Product[]> {
  const mongoCatalog = await fetchCatalogFromMongoDB();
  if (mongoCatalog && Array.isArray(mongoCatalog) && mongoCatalog.length > 0) {
    return mongoCatalog;
  }
  return catalog;
}

export async function GET(req: NextRequest) {
  try {
    const products = await getStoreCatalog();
    const user = await getAuthUser(req);

    if (!user) {
      return json({ products, user: null, bag: [], wishlist: [], orders: [] });
    }

    const { bag, wishlist, orders } = await fetchUserStoreDataFromMongoDB(user.userId);

    return json({
      products,
      user: { name: user.displayName, email: user.email },
      bag: bag || [],
      wishlist: wishlist || [],
      orders: orders || [],
    });
  } catch (e) {
    console.error('[Store GET Error]:', e);
    return json({ error: 'The store could not be loaded. Please try again.' }, 503);
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      return json({ error: 'Request not allowed' }, 403);
    }

    const user = await getAuthUser(req);
    if (!user) {
      return json({ error: 'Sign in to save your bag and favourites.', signIn: true }, 401);
    }

    const body = (await req.json()) as Record<string, unknown>;
    const products = await getStoreCatalog();
    const p = products.find(x => x.id === body.productId);

    // ---------------- BAG (CART) ACTION ---------------- //
    if (body.action === 'bag') {
      if (
        !p ||
        !p.sizes.includes(body.size as string) ||
        !Number.isInteger(body.quantity) ||
        (body.quantity as number) < 0 ||
        (body.quantity as number) > 10
      ) {
        return json({ error: 'Choose a valid size and a quantity from 1 to 10.' }, 400);
      }

      const size = body.size as string;
      const quantity = body.quantity as number;

      await syncBagItemToMongoDB({
        userId: user.userId,
        productId: p.id,
        size,
        quantity,
      });

      return json({ ok: true });
    }

    // ---------------- WISHLIST ACTION ---------------- //
    if (body.action === 'wishlist') {
      if (!p || typeof body.saved !== 'boolean') {
        return json({ error: 'Invalid product' }, 400);
      }

      await syncWishlistToMongoDB({
        userId: user.userId,
        productId: p.id,
        saved: body.saved,
      });

      return json({ ok: true });
    }

    // ---------------- CHECKOUT ACTION ---------------- //
    if (body.action === 'checkout') {
      if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.requestId)) {
        return json({ error: 'Invalid checkout request' }, 400);
      }

      const address = body.address as Record<string, string> | undefined;
      if (
        !address ||
        ['name', 'email', 'street', 'city', 'postal'].some(
          k => typeof address[k] !== 'string' || !address[k].trim() || address[k].length > 200
        ) ||
        !/^\S+@\S+\.\S+$/.test(address.email) ||
        !/^\d{6}$/.test(address.postal)
      ) {
        return json({ error: 'Enter a complete Indian delivery address and valid email.' }, 400);
      }

      const { bag: bagItems } = await fetchUserStoreDataFromMongoDB(user.userId);
      if (!bagItems || !bagItems.length) {
        return json({ error: 'Your bag is empty.' }, 400);
      }

      const items = bagItems.map(row => {
        const product = products.find(prod => prod.id === row.productId);
        if (!product || !product.sizes.includes(row.size)) {
          throw new Error('Product unavailable');
        }
        return {
          productId: row.productId,
          size: row.size,
          quantity: row.quantity,
          name: product.name,
          price: product.price,
          image: product.image,
        };
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

      const createdOrder = await createOrderInMongoDB({
        id,
        userId: user.userId,
        requestId: body.requestId,
        items,
        total,
        address: orderAddress,
        status: 'Confirmed',
        createdAt,
      });

      return json({
        id: createdOrder?.id || id,
        total: createdOrder?.total || total,
        items: createdOrder?.items || items,
        address: createdOrder?.address || orderAddress,
        status: createdOrder?.status || 'Confirmed',
        createdAt: createdOrder?.createdAt || createdAt,
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('[Store POST Error]:', e);
    return json({ error: 'Your changes could not be saved. Please try again.' }, 503);
  }
}
