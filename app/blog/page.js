import Link from 'next/link';
import { getPublishedArticles } from '@/lib/blog/store';
import { site } from '@/lib/site-config';
import ArticleCard from '@/components/blog/ArticleCard';
import BlogBrowser from '@/components/blog/BlogBrowser';
import Footer from '@/components/sections/footer';

// Re-render periodically so newly generated articles appear without a rebuild.
export const revalidate = 300;

export const metadata = {
  title: 'Insights — Digital Marketing, AI & Web in Qatar',
  description: `Practical articles on digital marketing, AI automation, web development and branding for businesses in Qatar and the GCC, from ${site.fullName}.`,
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: `${site.url}/blog`,
    title: `Insights | ${site.shortName}`,
    description: `Practical articles on digital marketing, AI automation and web development for businesses in Qatar and the GCC.`,
    images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.logo.alt }],
  },
};

export default async function BlogPage() {
  const articles = await getPublishedArticles();
  const [featured, ...rest] = articles;

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
      { '@type': 'ListItem', position: 2, name: 'Insights', item: `${site.url}/blog` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <main className="min-h-screen bg-background px-4 pb-20 pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-foreground">Insights</span>
          </nav>

          <header className="mb-12 max-w-3xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {site.shortName} Insights
            </p>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Ideas that move businesses forward
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Practical writing on digital marketing, AI automation, web development and brand
              building — written for businesses in Qatar and across the GCC.
            </p>
          </header>

          {articles.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-muted-foreground">
              The first articles are on their way. Check back shortly.
            </p>
          ) : (
            <>
              <section className="mb-14" aria-labelledby="featured-heading">
                <h2 id="featured-heading" className="sr-only">
                  Featured article
                </h2>
                <ArticleCard article={featured} featured priority />
              </section>

              <section aria-labelledby="latest-heading">
                <h2
                  id="latest-heading"
                  className="mb-6 text-2xl font-semibold text-foreground"
                >
                  Latest articles
                </h2>
                <BlogBrowser articles={rest} />
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
