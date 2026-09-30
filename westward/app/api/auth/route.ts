import {NextRequest, NextResponse} from 'next/server';
import {database} from '@/db/store';
import {
  ensureAuthTables,
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  buildSessionCookie,
  buildLogoutCookie,
  getAuthUser,
  parseCookies,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';
import {
  syncUserToMySQL,
  syncSessionToMySQL,
  deleteSessionFromMySQL,
} from '@/lib/mysql';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200, cookieHeader?: string | string[]) => {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  });
  if (cookieHeader) {
    if (Array.isArray(cookieHeader)) {
      for (const c of cookieHeader) {
        headers.append('Set-Cookie', c);
      }
    } else {
      headers.set('Set-Cookie', cookieHeader);
    }
  }
  return new NextResponse(JSON.stringify(data), {
    status,
    headers,
  });
};

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    return json({user});
  } catch (e) {
    console.error('Error fetching auth user:', e);
    return json({user: null});
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      return json({error: 'Request not allowed'}, 403);
    }

    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action as string;
    const db = database();
    await ensureAuthTables(db);

    if (action === 'register') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!name || name.length < 2 || name.length > 100) {
        return json({error: 'Please enter your full name (at least 2 characters).'}, 400);
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
        return json({error: 'Please enter a valid email address.'}, 400);
      }
      if (!password || password.length < 6) {
        return json({error: 'Password must be at least 6 characters.'}, 400);
      }

      // Check if user already exists
      const existing = await db
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(email)
        .first<{id: string}>();

      if (existing) {
        return json({error: 'An account with this email already exists. Please sign in instead.'}, 409);
      }

      const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const passwordHash = await hashPassword(password);
      const createdAt = new Date().toISOString();

      await db
        .prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(userId, name, email, passwordHash, createdAt)
        .run();

      const sessionId = await createSession(db, userId);
      const cookie = buildSessionCookie(sessionId);

      // Mirror to MySQL Workbench database
      await syncUserToMySQL({
        id: userId,
        name,
        email,
        passwordHash,
        createdAt,
      });
      await syncSessionToMySQL({
        id: sessionId,
        userId,
        createdAt,
        expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString(),
      });

      return json(
        {
          ok: true,
          user: {
            userId,
            displayName: name,
            email,
          },
        },
        201,
        cookie
      );
    }

    if (action === 'login') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!email || !password) {
        return json({error: 'Please enter both your email and password.'}, 400);
      }

      const user = await db
        .prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?')
        .bind(email)
        .first<{id: string; name: string; email: string; password_hash: string}>();

      if (!user) {
        return json({error: 'Invalid email or password. Please try again.'}, 401);
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return json({error: 'Invalid email or password. Please try again.'}, 401);
      }

      const sessionId = await createSession(db, user.id);
      const cookie = buildSessionCookie(sessionId);

      // Mirror session & user to MySQL Workbench database
      await syncUserToMySQL({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.password_hash,
        createdAt: new Date().toISOString(),
      });
      await syncSessionToMySQL({
        id: sessionId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString(),
      });

      return json(
        {
          ok: true,
          user: {
            userId: user.id,
            displayName: user.name,
            email: user.email,
          },
        },
        200,
        cookie
      );
    }

    if (action === 'logout') {
      const cookies = parseCookies(req.headers.get('cookie'));
      const sessionId = cookies[SESSION_COOKIE_NAME];
      if (sessionId) {
        await deleteSession(db, sessionId);
        await deleteSessionFromMySQL(sessionId);
      }

      const cookiesToClear = [
        buildLogoutCookie(),
        '__sites_local_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      ];

      return json({ok: true}, 200, cookiesToClear);
    }

    return json({error: 'Unknown action'}, 400);
  } catch (e) {
    console.error('Auth action error:', e);
    return json({error: 'Authentication failed. Please try again.'}, 500);
  }
}
