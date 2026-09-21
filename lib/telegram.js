/**
 * Server-only Telegram delivery.
 *
 * The bot token is read from the environment at call time and never returned,
 * logged, or included in an error surfaced to the client. Import this only
 * from route handlers / server code — never from a Client Component.
 */

import { site } from './site-config';

/** Escape text for Telegram's HTML parse mode. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** True when both credentials are present, so callers can fail fast. */
export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/**
 * Build the lead notification from ALREADY-VALIDATED fields.
 *
 * Every value is escaped, and only known fields are rendered — the client
 * cannot inject arbitrary message content.
 */
export function formatLeadMessage(lead, meta = {}) {
  const lines = [`🔔 <b>NEW LEAD — ${escapeHtml(site.shortName)}</b>`, ''];

  const row = (emoji, label, value) => {
    if (value === undefined || value === null || String(value).trim() === '') return;
    lines.push(`${emoji} <b>${label}:</b> ${escapeHtml(value)}`);
  };

  row('👤', 'Name', lead.name);
  row('🏢', 'Company', lead.company);
  row('📞', 'Phone', lead.phone);
  row('📧', 'Email', lead.email);
  row('💼', 'Service', lead.service);
  row('📍', 'Location', lead.address);

  if (lead.message) {
    lines.push('', `💬 <b>Message:</b>`, escapeHtml(lead.message));
  }

  lines.push('');
  row('🌐', 'Source', meta.source || 'Website');
  row('📄', 'Page', meta.page);
  row('🕐', 'Time', meta.time);

  return lines.join('\n');
}

/**
 * Send a message to the configured chat.
 *
 * Resolves only on a confirmed Telegram `ok: true`, so callers can treat a
 * resolution as real delivery and never show the user a false success.
 */
export async function sendTelegramMessage(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error('TELEGRAM_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let response;
  let data;
  try {
    response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    data = await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || data?.ok !== true) {
    // `description` can echo the request but never the token; still, keep it
    // server-side only — callers surface a generic message to the browser.
    throw new Error(
      `TELEGRAM_SEND_FAILED: ${response.status} ${data?.description || 'unknown error'}`
    );
  }

  return data;
}
