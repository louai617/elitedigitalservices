/**
 * Featured images.
 *
 * Default strategy generates a unique, on-brand SVG cover per article: an
 * inline vector (a few KB, no external request, no layout shift) whose palette
 * and geometry derive from the article's own slug, so no two articles share a
 * cover. Set AI_IMAGE_API_URL to hand this job to an image model instead.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { categoryTitle } from './schema';

const OUT_DIR = path.join(process.cwd(), 'public', 'blog');

/** Stable 32-bit hash so a slug always yields the same cover. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Covers are built from the official EMS palette — ink #0A0A0C, bone #F6F4F0,
 * gold #C9A227 — with the second stop varied per article so no two covers
 * look alike.
 */
const INK = '#0A0A0C';
const BONE = '#F6F4F0';
const GOLD = '#C9A227';

const PALETTES = [
  [INK, '#12202E', GOLD],
  [INK, '#1D1A10', GOLD],
  [INK, '#0E2620', '#D4B23C'],
  [INK, '#241426', GOLD],
  [INK, '#2A1A12', '#D4B23C'],
  [INK, '#10243A', GOLD],
];

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Wrap a title onto at most 3 lines that fit the cover width. */
function wrap(title, maxChars = 26, maxLines = 3) {
  const words = title.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (lines.length < maxLines && line) lines.push(line.trim());
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[,.;:]$/, '')}…`;
  }
  return lines;
}

export function buildCoverSvg(article) {
  const seed = hash(article.slug);
  const [bg, mid, accent] = PALETTES[seed % PALETTES.length];
  const angle = seed % 360;
  const lines = wrap(article.title);
  const label = categoryTitle(article.category).toUpperCase();

  // A nod to the EMS viewfinder mark: corner brackets with a focal dot.
  const b = 26; const t = 5; const bx = 72; const by = 84;
  const bracket = [
    `<path d="M${bx} ${by + b} V${by} H${bx + b}" fill="none" stroke="${BONE}" stroke-width="${t}"/>`,
    `<circle cx="${bx + b + 16}" cy="${by + 2}" r="5" fill="${accent}"/>`,
  ].join('');

  // Decorative arcs, seeded so each article gets a distinct composition.
  const arcs = Array.from({ length: 4 }, (_, i) => {
    const r = 160 + ((seed >> (i * 3)) % 220);
    const cx = 900 + ((seed >> (i * 2)) % 340);
    const cy = 120 + ((seed >> (i * 4)) % 420);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accent}" stroke-opacity="${0.06 + i * 0.03}" stroke-width="1.5"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(article.imageAlt || article.title)}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${mid}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  ${arcs}
  ${bracket}
  <text x="72" y="152" font-family="Helvetica,Arial,sans-serif" font-size="22" letter-spacing="5" fill="${accent}" fill-opacity="0.9">${escapeXml(label)}</text>
  ${lines
    .map(
      (line, i) =>
        `<text x="72" y="${262 + i * 74}" font-family="Helvetica,Arial,sans-serif" font-size="60" font-weight="700" fill="#f9fafb">${escapeXml(line)}</text>`
    )
    .join('\n  ')}
  <text x="72" y="556" font-family="Helvetica,Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="6" fill="${BONE}">ELITE</text>
  <text x="72" y="580" font-family="Helvetica,Arial,sans-serif" font-size="13" font-weight="500" letter-spacing="7" fill="${accent}">MEDIA SOLUTIONS</text>
</svg>`;
}

/**
 * Produce the featured image for an article and return its public path.
 * Filenames are descriptive (the slug), as requested.
 */
export async function createFeaturedImage(article) {
  // Optional hook: point AI_IMAGE_API_URL at an image endpoint that accepts
  // {prompt} and returns {url}. Falls back to the branded cover on any error.
  if (process.env.AI_IMAGE_API_URL) {
    try {
      const response = await fetch(process.env.AI_IMAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.AI_IMAGE_API_KEY
            ? { Authorization: `Bearer ${process.env.AI_IMAGE_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          prompt: `Professional, modern editorial cover image for an article titled "${article.title}". Dark, premium, minimal, gold accent. No text.`,
        }),
      });
      const data = await response.json();
      if (response.ok && data?.url) return data.url;
      console.error('[blog] image API returned no url; using generated cover');
    } catch (error) {
      console.error('[blog] image API failed, using generated cover:', error.message);
    }
  }

  const file = `${article.slug}.svg`;
  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUT_DIR, file), buildCoverSvg(article), 'utf8');
    return `/blog/${file}`;
  } catch (error) {
    // A cover is not worth failing an article over — fall back to the shared
    // Open Graph image and let the caller carry on.
    console.error(`[blog] could not write cover for ${article.slug}:`, error.message);
    return null;
  }
}
