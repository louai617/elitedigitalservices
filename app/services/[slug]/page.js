import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { site } from '@/lib/site-config';
import { getPublishedArticles } from '@/lib/blog/store';
import ArticleCard from '@/components/blog/ArticleCard';
import Footer from '@/components/sections/footer';

export const revalidate = 3600;

export function generateStaticParams() {
  return site.services.map((service) => ({ slug: service.slug }));
}

function findService(slug) {
  return site.services.find((s) => s.slug === slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return { title: 'Service not found' };

  const url = `${site.url}/services/${service.slug}`;
  return {
    title: `${service.title} in Qatar`,
    description: service.summary,
    keywords: service.keywords,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      type: 'website',
      url,
      title: `${service.title} | ${site.shortName}`,
      description: service.summary,
      siteName: site.name,
      images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.logo.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.title} | ${site.shortName}`,
      description: service.summary,
      images: [site.ogImage],
    },
  };
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) notFound();

  // Surface articles that target this service's keywords.
  const articles = await getPublishedArticles();
  const related = articles
    .filter((article) =>
      service.keywords.some((keyword) =>
        [...(article.keywords || []), article.title].some((field) =>
          field.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    )
    .slice(0, 3);

  const url = `${site.url}/services/${service.slug}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.description,
      serviceType: service.title,
      url,
      areaServed: [
        { '@type': 'Country', name: 'Qatar' },
        { '@type': 'City', name: 'Doha' },
      ],
      provider: {
        '@type': 'Organization',
        name: site.name,
        url: site.url,
        logo: `${site.url}${site.logo.src}`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
        { '@type': 'ListItem', position: 2, name: 'Services', item: `${site.url}/#services` },
        { '@type': 'ListItem', position: 3, name: service.title, item: url },
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
        <div className="mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href="/#services" className="transition-colors hover:text-primary">Services</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-foreground">{service.title}</span>
          </nav>

          <header className="mb-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {site.shortName} Services
            </p>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {service.title}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">{service.summary}</p>
          </header>

          <section className="mb-12">
            <p className="text-base leading-[1.8] text-muted-foreground sm:text-lg">
              {service.description}
            </p>
          </section>

          <section className="mb-12" aria-labelledby="offerings-heading">
            <h2 id="offerings-heading" className="mb-5 text-2xl font-semibold text-foreground">
              What this includes
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {service.offerings.map((offering) => (
                <li
                  key={offering}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">{offering}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-7">
            <p className="mb-5 text-base leading-relaxed text-foreground">
              Ready to grow your business? Talk to {site.name} about your next digital project.
            </p>
            <Link
              href="/#contact"
              className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get in touch
            </Link>
          </aside>

          {related.length > 0 && (
            <section className="mt-16" aria-labelledby="related-heading">
              <h2 id="related-heading" className="mb-6 text-2xl font-semibold text-foreground">
                Related reading
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
