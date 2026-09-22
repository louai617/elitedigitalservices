'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ArticleCard from './ArticleCard';
import { CATEGORIES } from '@/lib/blog/schema';

const PAGE_SIZE = 9;

/**
 * Search + category filtering + "load more" over a list the server already
 * rendered. Filtering client-side keeps the page a static render (fast on
 * mobile, no request per keystroke) — the list is small by design.
 */
export default function BlogBrowser({ articles }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Only offer categories that actually have articles.
  const availableCategories = useMemo(() => {
    const present = new Set(articles.map((a) => a.category));
    return CATEGORIES.filter((c) => present.has(c.slug));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (category !== 'all' && article.category !== category) return false;
      if (!q) return true;
      return (
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        (article.keywords || []).some((k) => k.toLowerCase().includes(q)) ||
        (article.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [articles, query, category]);

  const shown = filtered.slice(0, visible);

  const resetTo = (updater) => {
    updater();
    setVisible(PAGE_SIZE);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => resetTo(() => setQuery(e.target.value))}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => resetTo(() => setCategory('all'))}
            aria-pressed={category === 'all'}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              category === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-white/10 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            All
          </button>
          {availableCategories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => resetTo(() => setCategory(c.slug))}
              aria-pressed={category === c.slug}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                category === c.slug
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/10 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        {filtered.length} article{filtered.length === 1 ? '' : 's'} found
      </p>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-muted-foreground">
          No articles match that search yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}

      {visible < filtered.length && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border border-primary/50 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Load more articles
          </button>
        </div>
      )}
    </div>
  );
}
