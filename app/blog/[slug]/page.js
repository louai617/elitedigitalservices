import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getPublishedArticles } from '@/lib/blog/store';
import { categoryTitle } from '@/lib/blog/schema';
import { planInternalLinks } from '@/lib/blog/internal-links';
import { site } from '@/lib/site-config';
import ArticleBody from '@/components/blog/ArticleBody';
import ArticleCard from '@/components/blog/ArticleCard';
import Footer from '@/components/sections/footer';

export const revalidate = 300;
// Articles added after the build are rendered on demand, then cached.
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article not found' };

  const url = `${site.url}/blog/${article.slug}`;
  const image = article.image ? `${site.url}${article.image}` : site.ogImage;

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      siteName: site.name,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      section: categoryTitle(article.category),
      tags: article.tags,
      images: [{ url: image, width: 1200, height: 630, alt: article.imageAlt || article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      images: [image],
    },
  };
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const all = await getPublishedArticles();
  const links = planInternalLinks(article, all);
  const related = all.filter((a) => a.slug !== article.slug).slice(0, 3);
  const url = `${site.url}/blog/${article.slug}`;
  const image = article.image ? `${site.url}${article.image}` : site.ogImage;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      headline: article.title,
      description: article.seoDescription || article.excerpt,
      image: [image],
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: { '@type': 'Organization', name: article.author, url: site.url },
      publisher: {
        '@type': 'Organization',
        name: site.name,
        logo: { '@type': 'ImageObject', url: `${site.url}${site.logo.src}` },
      },
      articleSection: categoryTitle(article.category),
      keywords: (article.keywords || []).join(', '),
      wordCount: [
        article.intro,
        ...article.sections.flatMap((s) => [...s.paragraphs, ...s.list]),
      ].join(' ').split(/\s+/).length,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
        { '@type': 'ListItem', position: 2, name: 'Insights', item: `${site.url}/blog` },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen bg-background px-4 pb-20 pt-28 sm:pt-32">
        <article className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href="/blog" className="transition-colors hover:text-primary">Insights</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-foreground">{categoryTitle(article.category)}</span>
          </nav>

          <header className="mb-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {categoryTitle(article.category)}
            </p>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{article.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>{article.readingTime} min read</span>
            </div>
          </header>

          {article.image && (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={article.image}
                alt={article.imageAlt || article.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <ArticleBody article={article} links={links} />

          {article.cta && (
            <aside className="mt-14 rounded-2xl border border-primary/30 bg-primary/[0.06] p-7">
              <p className="mb-5 text-base leading-relaxed text-foreground">{article.cta}</p>
              <Link
                href="/#contact"
                className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Talk to {site.shortName}
              </Link>
            </aside>
          )}

          {article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="mx-auto mt-20 max-w-7xl" aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-6 text-2xl font-semibold text-foreground">
              Keep reading
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
