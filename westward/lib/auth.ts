import {
  getSessionUserFromMongoDB,
  createSessionInMongoDB,
  deleteSessionInMongoDB,
} from '@/lib/mongodb';
import { getChatGPTUser } from '@/app/chatgpt-auth';

export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
};

export const SESSION_COOKIE_NAME = 'westward_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(
  password: string,
  salt: string = crypto.randomUUID().replace(/-/g, '')
): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${password}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${salt}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const enc = new TextEncoder();
  const data = enc.encode(`${password}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const testHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return testHex === hashHex;
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  }
  return cookies;
}

export async function getAuthUser(req?: Request): Promise<AuthUser | null> {
  try {
    // 1. Check for real session cookie
    const cookieHeader = req ? req.headers.get('cookie') : null;
    const cookies = parseCookies(cookieHeader);
    const sessionId = cookies[SESSION_COOKIE_NAME];

    if (sessionId) {
      const user = await getSessionUserFromMongoDB(sessionId);
      if (user) {
        return {
          userId: user.userId,
          displayName: user.displayName,
          email: user.email,
        };
      }
    }

    // 2. Fallback to mock user
    try {
      const chatUser = await getChatGPTUser();
      if (chatUser) {
        return {
          userId: chatUser.userId,
          displayName: chatUser.displayName,
          email: chatUser.email,
        };
      }
    } catch {
      // ignore
    }

    return null;
  } catch (err) {
    console.error('[MongoDB Auth Error]:', err);
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await createSessionInMongoDB({
    sessionId,
    userId,
    createdAt,
    expiresAt,
  });

  return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteSessionInMongoDB(sessionId);
}

export function buildSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function buildLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
