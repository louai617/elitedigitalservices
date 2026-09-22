/**
 * File-backed article store (server-only).
 *
 * One JSON file per article under `content/posts/`. This keeps the blog
 * dependency-free and works on any Node host, while the read API below is
 * narrow enough to swap for a database later without touching the pages.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { normaliseArticle } from './schema';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

/** Cache the parsed index briefly so a listing page is not O(files) per request. */
let cache = { at: 0, articles: null };
const CACHE_MS = Number(process.env.BLOG_CACHE_MS || 30_000);

async function ensureDir() {
  await fs.mkdir(POSTS_DIR, { recursive: true });
}

export function invalidateCache() {
  cache = { at: 0, articles: null };
}

/** Every article on disk, newest first, regardless of status. */
export async function getAllArticles({ fresh = false } = {}) {
  if (!fresh && cache.articles && Date.now() - cache.at < CACHE_MS) return cache.articles;

  await ensureDir();
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.json'));

  const articles = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
      articles.push(JSON.parse(raw));
    } catch (error) {
      // A single corrupt file must not take down the whole blog.
      console.error(`[blog] skipping unreadable article ${file}:`, error.message);
    }
  }

  articles.sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0)
  );

  cache = { at: Date.now(), articles };
  return articles;
}

/** Only what the public blog may show: published, and not future-dated. */
export async function getPublishedArticles() {
  const now = Date.now();
  const all = await getAllArticles();
  return all.filter(
    (a) => a.status === 'published' && a.publishedAt && new Date(a.publishedAt).getTime() <= now
  );
}

export async function getArticleBySlug(slug, { includeUnpublished = false } = {}) {
  const list = includeUnpublished ? await getAllArticles() : await getPublishedArticles();
  return list.find((a) => a.slug === slug) || null;
}

/**
 * Turn a read-only-filesystem error into an actionable one.
 *
 * Serverless platforms (Vercel, Netlify, Lambda) expose a read-only filesystem
 * apart from an ephemeral /tmp, so this store cannot persist there. Reading
 * articles committed to the repository still works — only generation fails.
 */
function explainWriteFailure(error) {
  if (error?.code === 'EROFS' || error?.code === 'EACCES' || error?.code === 'EPERM') {
    return new Error(
      `STORAGE_NOT_WRITABLE: cannot write to ${POSTS_DIR} (${error.code}). ` +
        'This host has a read-only filesystem, so generated articles cannot be ' +
        'persisted. Deploy to a host with a persistent disk (a VPS or a Node ' +
        'app plan), or move the store to a database. See DEPLOYMENT.md.'
    );
  }
  return error;
}

export async function saveArticle(input) {
  const article = normaliseArticle(input);
  const file = path.join(POSTS_DIR, `${article.slug}.json`);
  // Write to a temp file then rename, so a crash mid-write cannot leave a
  // truncated article that breaks the listing.
  const tmp = `${file}.tmp`;
  try {
    await ensureDir();
    await fs.writeFile(tmp, JSON.stringify(article, null, 2), 'utf8');
    await fs.rename(tmp, file);
  } catch (error) {
    throw explainWriteFailure(error);
  }
  invalidateCache();
  return article;
}

/**
 * Whether this host can persist generated articles.
 *
 * The result is cached for the life of the process: filesystem writability does
 * not change at runtime, and probing on every request would write a file into a
 * directory the dev server watches — which costs a spurious hot reload each
 * time the admin page renders.
 */
let writableProbe = null;

export async function isStorageWritable() {
  if (writableProbe !== null) return writableProbe;

  const probe = path.join(POSTS_DIR, '.write-probe');
  try {
    await ensureDir();
    await fs.writeFile(probe, 'ok', 'utf8');
    await fs.unlink(probe);
    writableProbe = true;
  } catch {
    writableProbe = false;
  }
  return writableProbe;
}

export async function deleteArticle(slug) {
  const file = path.join(POSTS_DIR, `${path.basename(slug)}.json`);
  try {
    await fs.unlink(file);
    invalidateCache();
    return true;
  } catch {
    return false;
  }
}

/** Slugs, titles and keywords already used — the dedupe input for generation. */
export async function getContentFingerprint() {
  const all = await getAllArticles({ fresh: true });
  return {
    slugs: all.map((a) => a.slug),
    titles: all.map((a) => a.title),
    keywords: [...new Set(all.flatMap((a) => a.keywords || []))],
    categories: all.map((a) => a.category),
    recent: all.slice(0, 30).map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      publishedAt: a.publishedAt,
    })),
  };
}
