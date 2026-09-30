import {database} from '@/db/store';
import {getChatGPTUser} from '@/app/chatgpt-auth';

export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
};

export const SESSION_COOKIE_NAME = 'westward_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

let tablesReady = false;

export async function ensureAuthTables(db: ReturnType<typeof database>) {
  if (tablesReady) return;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY NOT NULL, name text NOT NULL, email text UNIQUE NOT NULL, password_hash text NOT NULL, created_at text NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY NOT NULL, user_id text NOT NULL, created_at text NOT NULL, expires_at text NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
  `);
  tablesReady = true;
}

export async function hashPassword(password: string, salt: string = crypto.randomUUID().replace(/-/g, '')): Promise<string> {
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
  const db = database();
  await ensureAuthTables(db);

  // 1. Check for real session cookie
  const cookieHeader = req ? req.headers.get('cookie') : null;
  const cookies = parseCookies(cookieHeader);
  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (sessionId) {
    const nowIso = new Date().toISOString();
    const session = await db
      .prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?')
      .bind(sessionId, nowIso)
      .first<{user_id: string}>();

    if (session && session.user_id) {
      const user = await db
        .prepare('SELECT id, name, email FROM users WHERE id = ?')
        .bind(session.user_id)
        .first<{id: string; name: string; email: string}>();

      if (user) {
        return {
          userId: user.id,
          displayName: user.name,
          email: user.email,
        };
      }
    }
  }

  // 2. Fallback to mock/ChatGPT header if present (for test suite backwards compatibility)
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
}

export async function createSession(db: ReturnType<typeof database>, userId: string): Promise<string> {
  await ensureAuthTables(db);
  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await db
    .prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(sessionId, userId, createdAt, expiresAt)
    .run();

  return sessionId;
}

export async function deleteSession(db: ReturnType<typeof database>, sessionId: string): Promise<void> {
  await ensureAuthTables(db);
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

export function buildSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function buildLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
