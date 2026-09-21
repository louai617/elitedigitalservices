import { NextResponse } from 'next/server';
import { generateBatch } from '@/lib/blog/generate';
import { isAIConfigured } from '@/lib/blog/ai-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Generation is slow; give it room on hosts that allow a longer function budget.
export const maxDuration = 300;

/**
 * Daily generation endpoint.
 *
 * Protected by CRON_SECRET — without it the route refuses every request, so a
 * public URL cannot be used to burn API credit. Call it as:
 *
 *   curl -X POST https://elitemedia.qa/api/cron/generate \
 *        -H "Authorization: Bearer $CRON_SECRET"
 */
function authorised(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const headerSecret = request.headers.get('x-cron-secret') || '';
  // Also accept ?secret= so hosts whose cron UI cannot set headers still work.
  const querySecret = new URL(request.url).searchParams.get('secret') || '';

  return [bearer, headerSecret, querySecret].some((value) => value && value === secret);
}

async function run(request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: 'AI is not configured. Set AI_API_KEY (and optionally AI_PROVIDER / AI_MODEL).' },
      { status: 503 }
    );
  }

  // Hard daily cap, so a misconfigured cron cannot run up an API bill.
  const requested = Number(new URL(request.url).searchParams.get('count') || process.env.BLOG_ARTICLES_PER_DAY || 1);
  const cap = Number(process.env.BLOG_MAX_ARTICLES_PER_RUN || 3);
  const count = Math.max(1, Math.min(requested, cap));

  const started = Date.now();
  const { results, errors } = await generateBatch(count);

  return NextResponse.json({
    ok: errors.length === 0,
    requested: count,
    generated: results.length,
    durationMs: Date.now() - started,
    articles: results.map((r) => ({
      slug: r.article.slug,
      title: r.article.title,
      category: r.article.category,
      words: r.article.readingTime * 200,
      model: r.model,
      usage: r.usage,
      rejectedTopics: r.rejectedTopics,
    })),
    errors,
  });
}

export async function POST(request) {
  return run(request);
}

// GET is supported because some cron schedulers can only issue a GET.
export async function GET(request) {
  return run(request);
}
