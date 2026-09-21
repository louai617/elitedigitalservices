/**
 * The article generation pipeline.
 *
 * Two model calls per article: one to choose a topic (given everything already
 * published, so it cannot repeat itself), one to write it. The topic is
 * checked against existing content BETWEEN the two calls, so a rejected topic
 * costs one cheap call rather than a whole article.
 */

import { generateJSON, getAIConfig } from './ai-provider';
import { getContentFingerprint, getAllArticles, saveArticle } from './store';
import { CATEGORIES, categoryTitle, slugify, normaliseArticle } from './schema';
import { chooseCategory, checkTopicIsNew, TOPIC_SEEDS, LOCAL_ANGLES } from './topics';
import { createFeaturedImage } from './images';
import { site } from '../site-config';

/**
 * The editorial standard. This is the main defence against the "hundreds of
 * thin, repetitive AI pages" failure mode — it is deliberately blunt about
 * what the model must NOT do.
 */
const SYSTEM_PROMPT = `You are the senior content strategist for ${site.fullName}, a digital agency in Doha, Qatar serving clients across Qatar and the GCC.

You write for business owners and marketing managers. Your work is judged on whether a reader finishes the article better equipped to act.

Absolute rules:
- Write for the reader first, search engines second.
- NEVER invent statistics, percentages, study results, survey data, report titles, or citations. If you do not have reliable evidence for a number, do not use a number — describe the effect qualitatively instead.
- NEVER attribute a claim to a named source, company, or publication.
- Do not present opinion or general principle as established fact.
- No keyword stuffing. Use the target keyword naturally; if a sentence reads awkwardly, rewrite it.
- No filler ("in today's fast-paced digital world", "in conclusion, it is clear that").
- No repetition of the same point in different words.
- Be specific and concrete. Prefer a worked example over an abstraction.
- Where a location is mentioned, it must be relevant to the point being made. Never insert a place name for SEO alone.
- Mention ${site.shortName} only where genuinely relevant, and at most twice in the body. The closing call to action is separate.`;

const TOPIC_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    angle: { type: 'string' },
    searchIntent: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'slug', 'angle', 'searchIntent', 'keywords'],
  additionalProperties: false,
};

const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    excerpt: { type: 'string' },
    intro: { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          paragraphs: { type: 'array', items: { type: 'string' } },
          list: { type: 'array', items: { type: 'string' } },
        },
        required: ['heading', 'paragraphs', 'list'],
        additionalProperties: false,
      },
    },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    imageAlt: { type: 'string' },
    cta: { type: 'string' },
  },
  required: ['title', 'excerpt', 'intro', 'sections', 'seoTitle', 'seoDescription', 'keywords', 'tags', 'imageAlt', 'cta'],
  additionalProperties: false,
};

function pick(list, seed) {
  return list[seed % list.length];
}

/** Step 1 — choose a topic that does not repeat existing work. */
async function proposeTopic(fingerprint, category) {
  const seeds = TOPIC_SEEDS[category] || [];
  const seed = Date.now();
  const localAngle = pick(LOCAL_ANGLES, seed);

  const prompt = `Propose ONE article for the "${categoryTitle(category)}" category.

Angles worth exploring in this category:
${seeds.map((s) => `- ${s}`).join('\n')}

Articles already published (do NOT repeat or rephrase any of these):
${fingerprint.titles.length ? fingerprint.titles.map((t) => `- ${t}`).join('\n') : '- (none yet)'}

Keywords already targeted (choose a DIFFERENT primary keyword):
${fingerprint.keywords.length ? fingerprint.keywords.join(', ') : '(none yet)'}

Requirements:
- Target a specific long-tail search intent, not a broad head term. "How hospitality businesses in Qatar can increase direct bookings" is good; "Digital marketing" is not.
- ${Math.random() < 0.55 ? `Give it a local angle relevant to ${localAngle}, but only if the topic genuinely warrants it.` : 'Keep it broadly applicable; do not force a location into it.'}
- "keywords": 3-6 terms, most important first. The first is the primary keyword.
- "slug": lowercase, hyphenated, 3-8 words.
- "searchIntent": what the reader typed into Google and what they need back.`;

  const { data } = await generateJSON({ system: SYSTEM_PROMPT, prompt, schema: TOPIC_SCHEMA });
  return { ...data, slug: slugify(data.slug || data.title) };
}

/** Step 2 — write the article to the required structure. */
async function writeArticle(topic, category, maxWords) {
  const prompt = `Write the article.

Title: ${topic.title}
Category: ${categoryTitle(category)}
Angle: ${topic.angle}
Search intent: ${topic.searchIntent}
Primary keyword: ${topic.keywords[0]}
Supporting keywords: ${topic.keywords.slice(1).join(', ')}

Target length: roughly ${maxWords} words total. Quality over length — do not pad to reach it.

Structure ("sections", in this order):
1. A section covering the main topic — what it is and why it matters to the reader.
2. A section of key strategies — practical and specific. Use "list" for the strategies.
3. A section of practical examples relevant to real businesses.
4. A section on common mistakes. Use "list".
5. A section titled "How ${site.shortName} Can Help" — connect the topic to ${site.shortName}'s relevant service in 2-3 sentences. Understated, not a sales pitch.
6. A conclusion that summarises what the reader should do next.

Other fields:
- "intro": 2-3 sentences before the first heading. Do not restate the title.
- "excerpt": one sentence, max 160 characters, for the article card.
- "seoTitle": max 60 characters, includes the primary keyword naturally.
- "seoDescription": max 155 characters, describes the value of reading it.
- "imageAlt": a descriptive alt text for the cover image.
- "cta": one or two sentences inviting the reader to get in touch with ${site.name}. Subtle.
- Use "list" only where a list genuinely helps; otherwise pass an empty array.

Remember: no invented statistics, no fabricated sources, no filler.`;

  const { data, usage, model } = await generateJSON({
    system: SYSTEM_PROMPT,
    prompt,
    schema: ARTICLE_SCHEMA,
  });
  return { data, usage, model };
}

/**
 * Generate and store one article.
 *
 * @param {object} options
 * @param {string} [options.category] force a category instead of rotating
 * @param {string} [options.status] 'published' (default) or 'draft'
 * @returns {Promise<{article: object, usage: object, model: string}>}
 */
export async function generateArticle({ category, status = 'published' } = {}) {
  const cfg = getAIConfig();
  if (!cfg.apiKey) throw new Error('AI_NOT_CONFIGURED: set AI_API_KEY');

  const maxWords = Number(process.env.BLOG_MAX_WORDS || 1100);
  const fingerprint = await getContentFingerprint();
  const chosen =
    category && CATEGORIES.some((c) => c.slug === category)
      ? category
      : chooseCategory(fingerprint.recent);

  // Try a few topics before giving up, so one near-duplicate proposal does not
  // waste the whole run.
  let topic = null;
  const rejected = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = await proposeTopic(fingerprint, chosen);
    const verdict = checkTopicIsNew(candidate, fingerprint);
    if (verdict.ok) {
      topic = candidate;
      break;
    }
    rejected.push(`${candidate.title} — ${verdict.reason}`);
  }

  if (!topic) {
    throw new Error(`TOPIC_EXHAUSTED: every proposal duplicated existing content (${rejected.join('; ')})`);
  }

  const { data, usage, model } = await writeArticle(topic, chosen, maxWords);

  let article = normaliseArticle({
    ...data,
    title: data.title || topic.title,
    slug: topic.slug,
    category: chosen,
    keywords: data.keywords?.length ? data.keywords : topic.keywords,
    status,
    publishedAt: status === 'published' ? new Date().toISOString() : null,
    generatedBy: { provider: cfg.provider, model, at: new Date().toISOString() },
  });

  article.image = await createFeaturedImage(article);
  article = await saveArticle(article);

  return { article, usage, model, rejectedTopics: rejected };
}

/** Generate several articles in one run, stopping at the first hard failure. */
export async function generateBatch(count = 1) {
  const results = [];
  const errors = [];
  for (let i = 0; i < count; i += 1) {
    try {
      results.push(await generateArticle());
    } catch (error) {
      errors.push(error.message);
      break;
    }
  }
  return { results, errors };
}

export { getAllArticles };
