/**
 * Article shape and normalisation.
 *
 * Articles are stored as one JSON file per slug under `content/posts/`. The
 * shape is deliberately CMS-like so this can move to a database later without
 * changing the rendering layer.
 */

export const CATEGORIES = [
  { slug: 'digital-marketing', title: 'Digital Marketing' },
  { slug: 'social-media', title: 'Social Media' },
  { slug: 'ai-automation', title: 'AI & Automation' },
  { slug: 'web-development', title: 'Web Development' },
  { slug: 'branding-design', title: 'Branding & Design' },
  { slug: 'paid-advertising', title: 'Paid Advertising' },
  { slug: 'business-growth', title: 'Business Growth' },
  { slug: 'hospitality-tourism', title: 'Hospitality & Tourism' },
  { slug: 'real-estate-marketing', title: 'Real Estate Marketing' },
  { slug: 'qatar-business', title: 'Qatar Business' },
];

export const STATUSES = ['draft', 'scheduled', 'published'];

export function categoryTitle(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.title || 'Insights';
}

/** URL-safe slug from a title. */
export function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
}

/** ~200 wpm over every text node in the article body. */
export function readingTime(article) {
  const text = [
    article.excerpt || '',
    ...(article.sections || []).flatMap((s) => [
      s.heading || '',
      ...(s.paragraphs || []),
      ...(s.list || []),
    ]),
  ].join(' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Fill in derived fields and drop anything unexpected, so a malformed AI
 * response can never produce a half-valid article on disk.
 */
/** Trim to a length without cutting a word in half. */
function truncateAtWord(text, max) {
  const value = String(text).trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  // Fall back to a hard cut only if there is no sensible break point.
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, '');
}

export function normaliseArticle(input) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Article requires a title');

  const slug = slugify(input.slug || title);
  if (!slug) throw new Error('Article requires a usable slug');

  const sections = (Array.isArray(input.sections) ? input.sections : [])
    .map((s) => ({
      heading: String(s.heading || '').trim(),
      paragraphs: (Array.isArray(s.paragraphs) ? s.paragraphs : [])
        .map((t) => String(t).trim())
        .filter(Boolean),
      list: (Array.isArray(s.list) ? s.list : []).map((t) => String(t).trim()).filter(Boolean),
    }))
    .filter((s) => s.heading && (s.paragraphs.length || s.list.length));

  const now = new Date().toISOString();
  const status = STATUSES.includes(input.status) ? input.status : 'draft';

  const article = {
    id: input.id || slug,
    title,
    slug,
    excerpt: String(input.excerpt || '').trim(),
    intro: String(input.intro || '').trim(),
    sections,
    category: CATEGORIES.some((c) => c.slug === input.category) ? input.category : 'digital-marketing',
    tags: (Array.isArray(input.tags) ? input.tags : []).map((t) => String(t).trim()).filter(Boolean).slice(0, 8),
    keywords: (Array.isArray(input.keywords) ? input.keywords : []).map((k) => String(k).trim()).filter(Boolean).slice(0, 12),
    author: String(input.author || 'Elite Media Solutions').trim(),
    seoTitle: truncateAtWord(input.seoTitle || title, 65),
    seoDescription: truncateAtWord(input.seoDescription || input.excerpt || '', 160),
    image: input.image || null,
    imageAlt: String(input.imageAlt || title).trim(),
    cta: String(input.cta || '').trim(),
    status,
    publishedAt: input.publishedAt || (status === 'published' ? now : null),
    updatedAt: now,
    createdAt: input.createdAt || now,
    generatedBy: input.generatedBy || null,
  };

  article.readingTime = readingTime(article);
  return article;
}
