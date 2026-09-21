import { NextResponse } from 'next/server';
import { validateLead } from '@/lib/validate-lead';
import { formatLeadMessage, sendTelegramMessage, isTelegramConfigured } from '@/lib/telegram';

// Leads must hit the live Telegram API, so this route is never cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Small in-memory rate limit: 5 submissions per IP per 10 minutes.
 * Good enough for a single-instance Node deployment; swap for Redis if EMS
 * ever runs more than one instance.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Accept both the flat shape and the legacy `{ formData }` wrapper, but note
  // that any client-supplied message text is deliberately ignored: the
  // notification is built here, from validated fields only.
  const input = body?.formData && typeof body.formData === 'object' ? body.formData : body;

  const result = validateLead(input);
  if (!result.ok) {
    // Silently accept honeypot hits so bots get no feedback to tune against.
    if (result.spam) return NextResponse.json({ success: true });
    return NextResponse.json(
      { success: false, error: 'Please check the highlighted fields.', fields: result.errors },
      { status: 400 }
    );
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions. Please try again shortly.' },
      { status: 429 }
    );
  }

  if (!isTelegramConfigured()) {
    // Never claim success when the lead has nowhere to go.
    console.error('[send-contact] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set.');
    return NextResponse.json(
      { success: false, error: 'We could not send your message right now. Please email us directly.' },
      { status: 503 }
    );
  }

  const text = formatLeadMessage(result.lead, {
    source: 'Website',
    page: typeof input?.page === 'string' ? input.page.slice(0, 200) : undefined,
    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Qatar', hour12: false }) + ' (Doha)',
  });

  try {
    await sendTelegramMessage(text);
  } catch (error) {
    // Log server-side for diagnosis; return a generic message to the browser.
    console.error('[send-contact] Telegram delivery failed:', error.message);
    return NextResponse.json(
      { success: false, error: 'We could not send your message right now. Please email us directly.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
