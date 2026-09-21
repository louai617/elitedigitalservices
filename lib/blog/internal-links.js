/**
 * Automatic internal linking.
 *
 * Runs over the finished article and turns the FIRST natural mention of a
 * service or a related post into a link. Capped deliberately — a wall of
 * internal links reads as spam and dilutes every link on the page.
 */

import { site } from '../site-config';

const MAX_SERVICE_LINKS = 3;
const MAX_ARTICLE_LINKS = 3;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the link plan for an article.
 *
 * Returns plain data (not HTML) so the renderer stays in control of markup —
 * nothing generated here is ever injected as raw HTML.
 *
 * @returns {Array<{phrase: string, href: string, label: string}>}
 */
export function planInternalLinks(article, otherArticles = []) {
  const haystack = [
    article.intro || '',
    ...(article.sections || []).flatMap((s) => s.paragraphs || []),
  ]
    .join(' ')
    .toLowerCase();

  const links = [];
  const used = new Set();

  for (const service of site.services) {
    if (links.length >= MAX_SERVICE_LINKS) break;
    const match = service.keywords.find(
      (keyword) => haystack.includes(keyword.toLowerCase()) && !used.has(keyword.toLowerCase())
    );
    if (match) {
      used.add(match.toLowerCase());
      links.push({ phrase: match, href: `/services/${service.slug}`, label: service.title });
    }
  }

  // Link related posts by shared keyword, newest first, never self-linking.
  const related = otherArticles
    .filter((other) => other.slug !== article.slug && other.status === 'published')
    .map((other) => {
      const shared = (other.keywords || []).filter((k) =>
        (article.keywords || []).some((own) => own.toLowerCase() === k.toLowerCase())
      );
      const sameCategory = other.category === article.category;
      return { other, score: shared.length + (sameCategory ? 0.5 : 0) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ARTICLE_LINKS);

  for (const { other } of related) {
    links.push({ phrase: null, href: `/blog/${other.slug}`, label: other.title });
  }

  return links;
}

/**
 * Split a paragraph into text/link parts for the first occurrence of each
 * phrase. Returns an array of {text} and {text, href} segments.
 */
export function linkifyParagraph(paragraph, links, alreadyLinked) {
  let parts = [{ text: paragraph }];

  for (const link of links) {
    if (!link.phrase || alreadyLinked.has(link.href)) continue;

    const next = [];
    let done = false;

    for (const part of parts) {
      if (done || part.href) {
        next.push(part);
        continue;
      }
      const re = new RegExp(`\\b(${escapeRegExp(link.phrase)})\\b`, 'i');
      const match = part.text.match(re);
      if (!match) {
        next.push(part);
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      if (start > 0) next.push({ text: part.text.slice(0, start) });
      next.push({ text: match[0], href: link.href });
      if (end < part.text.length) next.push({ text: part.text.slice(end) });
      alreadyLinked.add(link.href);
      done = true;
    }

    parts = next;
  }

  return parts;
}
