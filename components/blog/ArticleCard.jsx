import Image from 'next/image';
import Link from 'next/link';
import { categoryTitle } from '@/lib/blog/schema';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ArticleCard({ article, featured = false, priority = false }) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-primary/40 ${
        featured ? 'md:grid md:grid-cols-2' : ''
      }`}
    >
      <Link href={`/blog/${article.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">{article.title}</span>
      </Link>

      {/* Covers are generated at 1200x630, so the frame matches that ratio —
          otherwise object-cover crops the bracket motif off the edge. */}
      <div className="relative aspect-[40/21]">
        {article.image ? (
          <Image
            src={article.image}
            alt={article.imageAlt || article.title}
            fill
            sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className={`flex flex-col gap-3 p-5 ${featured ? 'md:justify-center md:p-8' : ''}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider text-primary">
            {categoryTitle(article.category)}
          </span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{article.readingTime} min read</span>
        </div>

        <h3
          className={`font-semibold leading-snug text-foreground transition-colors group-hover:text-primary ${
            featured ? 'text-2xl md:text-3xl' : 'text-lg'
          }`}
        >
          {article.title}
        </h3>

        <p className={`text-sm leading-relaxed text-muted-foreground ${featured ? 'md:text-base' : ''}`}>
          {article.excerpt}
        </p>
      </div>
    </article>
  );
}
