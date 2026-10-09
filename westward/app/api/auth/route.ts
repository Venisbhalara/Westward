import { NextRequest, NextResponse } from 'next/server';
import {
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
  registerUserInMongoDB,
  findUserByEmailInMongoDB,
} from '@/lib/mongodb';

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
    return json({ user });
  } catch (e) {
    console.error('Error fetching auth user:', e);
    return json({ user: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      return json({ error: 'Request not allowed' }, 403);
    }

    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action as string;

    if (action === 'register') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!name || name.length < 2 || name.length > 100) {
        return json({ error: 'Please enter your full name (at least 2 characters).' }, 400);
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
        return json({ error: 'Please enter a valid email address.' }, 400);
      }
      if (!password || password.length < 6) {
        return json({ error: 'Password must be at least 6 characters.' }, 400);
      }

      const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const passwordHash = await hashPassword(password);
      const createdAt = new Date().toISOString();
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const regResult = await registerUserInMongoDB({
        id: userId,
        name,
        email,
        passwordHash,
        createdAt,
        sessionId,
        expiresAt,
      });

      if (regResult.error) {
        return json({ error: regResult.error }, 409);
      }

      const cookie = buildSessionCookie(sessionId);

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
        return json({ error: 'Please enter both your email and password.' }, 400);
      }

      const user = await findUserByEmailInMongoDB(email);

      if (!user) {
        return json({ error: 'Invalid email or password. Please try again.' }, 401);
      }

      const valid = await verifyPassword(password, user.passwordHash as string);
      if (!valid) {
        return json({ error: 'Invalid email or password. Please try again.' }, 401);
      }

      const sessionId = await createSession(user.id as string);
      const cookie = buildSessionCookie(sessionId);

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
      const cookieHeader = req.headers.get('cookie');
      const cookies = parseCookies(cookieHeader);
      const sessionId = cookies[SESSION_COOKIE_NAME];
      if (sessionId) {
        await deleteSession(sessionId);
      }
      return json({ ok: true }, 200, buildLogoutCookie());
    }

    return json({ error: 'Invalid auth action' }, 400);
  } catch (e) {
    console.error('Auth error:', e);
    return json({ error: 'Authentication service encountered an error. Please try again.' }, 500);
  }
}
