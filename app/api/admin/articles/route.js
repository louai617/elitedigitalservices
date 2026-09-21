import { NextResponse } from 'next/server';
import { getAllArticles, saveArticle, deleteArticle, getArticleBySlug } from '@/lib/blog/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const articles = await getAllArticles({ fresh: true });
  return NextResponse.json({ articles });
}

/** Create or update an article. */
export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const existing = body.slug
    ? await getArticleBySlug(body.slug, { includeUnpublished: true })
    : null;

  try {
    const article = await saveArticle({
      ...(existing || {}),
      ...body,
      // Publishing for the first time stamps the date; later edits keep it.
      publishedAt:
        body.status === 'published'
          ? existing?.publishedAt || body.publishedAt || new Date().toISOString()
          : null,
    });
    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

  const removed = await deleteArticle(slug);
  if (!removed) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
