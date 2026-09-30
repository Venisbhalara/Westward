import {NextRequest, NextResponse} from 'next/server';
import {database} from '@/db/store';
import {getAuthUser} from '@/lib/auth';
import {saveContactInquiryToMySQL} from '@/lib/mysql';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
  });

let tablesReady = false;

export async function ensureContactTables(db: ReturnType<typeof database>) {
  if (tablesReady) return;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (id text PRIMARY KEY NOT NULL, user_id text, name text NOT NULL, email text NOT NULL, phone text, subject text NOT NULL, order_id text, message text NOT NULL, status text NOT NULL, created_at text NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_inquiries (created_at);
    CREATE INDEX IF NOT EXISTS idx_contact_user ON contact_inquiries (user_id);
  `);
  tablesReady = true;
}

export async function GET(req: NextRequest) {
  try {
    const db = database();
    await ensureContactTables(db);
    const user = await getAuthUser(req);

    if (!user) {
      return json({inquiries: []});
    }

    const rows = await db
      .prepare('SELECT id, name, email, phone, subject, order_id AS orderId, message, status, created_at AS createdAt FROM contact_inquiries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
      .bind(user.userId)
      .all<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        subject: string;
        orderId: string | null;
        message: string;
        status: string;
        createdAt: string;
      }>();

    return json({inquiries: rows.results});
  } catch (e) {
    console.error('Error fetching contact inquiries:', e);
    return json({inquiries: []});
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      return json({error: 'Request not allowed'}, 403);
    }

    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : 'General Inquiry';
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || name.length < 2 || name.length > 100) {
      return json({error: 'Please enter your full name (at least 2 characters).'}, 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
      return json({error: 'Please enter a valid email address.'}, 400);
    }
    if (phone && phone.length > 30) {
      return json({error: 'Please enter a valid phone number.'}, 400);
    }
    if (!subject || subject.length > 100) {
      return json({error: 'Please select or provide an inquiry subject.'}, 400);
    }
    if (!message || message.length < 10) {
      return json({error: 'Please provide message details of at least 10 characters.'}, 400);
    }
    if (message.length > 3000) {
      return json({error: 'Message exceeds maximum length of 3000 characters.'}, 400);
    }

    const db = database();
    await ensureContactTables(db);
    const user = await getAuthUser(req);

    const inquiryId = 'INQ-' + crypto.randomUUID().slice(0, 8).toUpperCase();
    const createdAt = new Date().toISOString();
    const userId = user ? user.userId : null;
    const status = 'Received';

    await db
      .prepare('INSERT INTO contact_inquiries (id, user_id, name, email, phone, subject, order_id, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(inquiryId, userId, name, email, phone || null, subject, orderId || null, message, status, createdAt)
      .run();

    // Mirror to MySQL Workbench database
    await saveContactInquiryToMySQL({
      id: inquiryId,
      userId,
      name,
      email,
      phone: phone || null,
      subject,
      orderId: orderId || null,
      message,
      status,
      createdAt,
    });

    return json(
      {
        ok: true,
        id: inquiryId,
        message: 'Your inquiry has been received. Our concierge team will review your message and respond within 24 hours.',
        estimatedResponse: 'Within 24 business hours',
        createdAt,
      },
      201
    );
  } catch (e) {
    console.error('Error saving contact inquiry:', e);
    return json({error: 'Your message could not be sent. Please try again.'}, 500);
  }
}
