/**
 * WESTWARD Atelier — Unified Storefront MongoDB API Client
 *
 * Communicates with the MongoDB persistent engine running on the local host.
 * All operations execute directly on MongoDB database `westward_db`.
 */

const BACKEND_URL = process.env.ADMIN_API_URL || 'http://127.0.0.1:5174/api/backend';

export async function fetchCatalogFromMongoDB() {
  try {
    const res = await fetch(`${BACKEND_URL}/products`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.products;
  } catch (err) {
    console.warn('[Storefront MongoDB Bridge Warning]:', (err as Error).message);
    return null;
  }
}

export async function fetchUserStoreDataFromMongoDB(userId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/store-data?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { bag: [], wishlist: [], orders: [] };
    return await res.json();
  } catch (err) {
    console.warn('[Storefront MongoDB Bridge Warning]:', (err as Error).message);
    return { bag: [], wishlist: [], orders: [] };
  }
}

export async function syncBagItemToMongoDB(item: {
  userId: string;
  productId: string;
  size: string;
  quantity: number;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/bag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncWishlistToMongoDB(item: {
  userId: string;
  productId: string;
  saved: boolean;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createOrderInMongoDB(order: {
  id: string;
  userId: string;
  requestId: string;
  items: unknown;
  total: number;
  address: unknown;
  status: string;
  createdAt: string;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order;
  } catch (err) {
    console.error('[Storefront MongoDB Order Error]:', err);
    return null;
  }
}

export async function registerUserInMongoDB(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  sessionId: string;
  expiresAt: string;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return await res.json();
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function findUserByEmailInMongoDB(email: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function createSessionInMongoDB(session: {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getSessionUserFromMongoDB(sessionId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/session?sessionId=${encodeURIComponent(sessionId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function deleteSessionInMongoDB(sessionId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/session?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveInquiryToMongoDB(inquiry: {
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
  try {
    const res = await fetch(`${BACKEND_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getUserInquiriesFromMongoDB(userId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/contact?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.inquiries || [];
  } catch {
    return [];
  }
}
