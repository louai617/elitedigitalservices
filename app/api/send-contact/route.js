import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('CONTACT BODY:', body); // <– log

    const { formData, messageText } = body;

    const message =
      messageText ||
      `<b>New contact form submission</b>\n\n` +
      `Name: ${formData?.name}\n` +
      `Email: ${formData?.email}\n` +
      `Message: ${formData?.message}`;

    const telegramResult = await sendToTelegram(message);
    console.log('TELEGRAM RESULT:', telegramResult); // <– log

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function sendToTelegram(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log('BOT TOKEN EXISTS?', !!botToken, 'CHAT ID:', chatId); // <– log

  if (!botToken || !chatId) {
    throw new Error('Telegram credentials not configured');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  const data = await response.json();
  console.log('TELEGRAM RAW RESPONSE:', data); // <– see 400/403 messages[web:3][web:25]

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status} – ${data.description}`);
  }

  return data;
}
