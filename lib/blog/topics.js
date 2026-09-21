/**
 * Topic planning: category rotation + duplicate rejection.
 *
 * The point of this module is to stop the generator producing the same article
 * with a new title. It decides WHICH category is due, gives the model the
 * titles and keywords already used, and rejects a proposal that is too close
 * to existing work.
 */

import { CATEGORIES } from './schema';

/**
 * Long-tail seed angles per category. These are prompts for the model's topic
 * step, not article titles — they steer it toward specific search intent
 * rather than head terms like "digital marketing".
 */
export const TOPIC_SEEDS = {
  'digital-marketing': [
    'measuring return on marketing spend for a small business',
    'building a first marketing funnel with a limited budget',
    'choosing between agency, freelancer and in-house marketing',
  ],
  'social-media': [
    'turning an Instagram following into paying customers',
    'short-form video workflows for a small team',
    'planning a month of content without burning out',
  ],
  'ai-automation': [
    'automating customer enquiries without losing a human touch',
    'practical AI agent use cases for a services business',
    'automating quoting, invoicing and follow-up',
  ],
  'web-development': [
    'what makes a business website actually convert',
    'site speed and its effect on enquiries',
    'when a business has outgrown a template website',
  ],
  'branding-design': [
    'signs a brand identity needs a refresh',
    'building a brand system a small team can apply consistently',
    'naming, tone of voice and visual identity working together',
  ],
  'paid-advertising': [
    'why an ad account stops performing and how to diagnose it',
    'landing page and ad message match',
    'setting a realistic first ad budget',
  ],
  'business-growth': [
    'building a repeatable lead pipeline',
    'pricing services without competing on cost',
    'retaining clients after the first project',
  ],
  'hospitality-tourism': [
    'increasing direct bookings instead of relying on OTAs',
    'marketing a restaurant opening',
    'turning guest reviews into a marketing asset',
  ],
  'real-estate-marketing': [
    'generating qualified property leads online',
    'marketing an off-plan development',
    'building an agent personal brand',
  ],
  'qatar-business': [
    'reaching a bilingual audience in Qatar',
    'seasonal demand patterns for Qatar businesses',
    'local search visibility in Doha',
  ],
};

/** Geographic angles, applied to roughly half of articles — never forced. */
export const LOCAL_ANGLES = ['Qatar', 'Doha', 'Lusail', 'The Pearl', 'West Bay', 'Al Wakrah', 'the GCC'];

/**
 * Pick the category that is least recently used, so coverage stays balanced
 * without being a rigid weekday rota.
 */
export function chooseCategory(recent = []) {
  const lastUsed = new Map(CATEGORIES.map((c) => [c.slug, -Infinity]));
  recent.forEach((article, index) => {
    // `recent` is newest-first, so a lower index means more recent.
    const position = recent.length - index;
    if (lastUsed.has(article.category)) {
      lastUsed.set(article.category, Math.max(lastUsed.get(article.category), position));
    }
  });

  let best = CATEGORIES[0].slug;
  let bestScore = Infinity;
  for (const category of CATEGORIES) {
    const score = lastUsed.get(category.slug);
    if (score < bestScore) {
      bestScore = score;
      best = category.slug;
    }
  }
  return best;
}

/** Normalised word set, minus filler that would inflate every comparison. */
const STOP = new Set([
  'a','an','the','and','or','for','to','in','of','on','with','your','you','how','what','why',
  'can','is','are','that','this','it','as','at','from','by','be','best','guide','tips',
]);

function tokenise(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/** Jaccard overlap between two strings, 0–1. */
export function similarity(a, b) {
  const setA = tokenise(a);
  const setB = tokenise(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const word of setA) if (setB.has(word)) shared += 1;
  return shared / (setA.size + setB.size - shared);
}

/**
 * Reject a proposed topic that repeats existing work.
 *
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function checkTopicIsNew(proposal, fingerprint, { threshold = 0.5 } = {}) {
  const { title = '', slug = '', keywords = [] } = proposal;

  if (fingerprint.slugs.includes(slug)) {
    return { ok: false, reason: `slug "${slug}" already exists` };
  }

  for (const existing of fingerprint.titles) {
    const score = similarity(title, existing);
    if (score >= threshold) {
      return { ok: false, reason: `title is ${(score * 100).toFixed(0)}% similar to "${existing}"` };
    }
  }

  // Reject when the primary keyword has already been targeted — that is the
  // signal that two articles would compete for the same query.
  const primary = String(keywords[0] || '').toLowerCase().trim();
  if (primary && fingerprint.keywords.some((k) => k.toLowerCase().trim() === primary)) {
    return { ok: false, reason: `primary keyword "${primary}" is already targeted` };
  }

  return { ok: true };
}
