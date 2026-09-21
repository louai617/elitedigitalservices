import { NextResponse } from 'next/server';
import { generateArticle } from '@/lib/blog/generate';
import { isAIConfigured, getAIConfig } from '@/lib/blog/ai-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Report current AI configuration (never the key itself). */
export async function GET() {
  if (!isAIConfigured()) {
    return NextResponse.json({ configured: false });
  }
  const cfg = getAIConfig();
  return NextResponse.json({
    configured: true,
    provider: cfg.provider,
    model: cfg.model,
    maxOutputTokens: cfg.maxOutputTokens,
    articlesPerDay: Number(process.env.BLOG_ARTICLES_PER_DAY || 1),
    maxWords: Number(process.env.BLOG_MAX_WORDS || 1100),
    cronConfigured: Boolean(process.env.CRON_SECRET),
  });
}

/** Trigger one generation on demand. */
export async function POST(request) {
  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: 'AI is not configured. Set AI_API_KEY in the environment.' },
      { status: 503 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // An empty body is fine — it means "rotate to the next category".
  }

  try {
    const { article, model, usage, rejectedTopics } = await generateArticle({
      category: body.category,
      status: body.status === 'draft' ? 'draft' : 'published',
    });
    return NextResponse.json({ article, model, usage, rejectedTopics });
  } catch (error) {
    console.error('[admin/generate] failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
