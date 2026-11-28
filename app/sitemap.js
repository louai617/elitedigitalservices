import { getPublishedArticles } from '@/lib/blog/store';
import { CATEGORIES } from '@/lib/blog/schema';
import { site } from '@/lib/site-config';
import { getPortfolio } from '@/lib/portfolio';
import { projectVideos } from '@/lib/project-seo';

// Regenerated on the same cadence as the blog, so a new article is listed
// within minutes of publishing without a rebuild.
export const revalidate = 300;

export default async function sitemap() {
  const [articles, projects] = await Promise.all([getPublishedArticles(), getPortfolio()]);

  // Note: /projects is only a redirect to the home page's projects section,
  // so it is deliberately absent — the case-study pages below are the real
  // indexable URLs.
  const staticRoutes = [
    { url: site.url, changeFrequency: 'monthly', priority: 1 },
    { url: `${site.url}/blog`, changeFrequency: 'daily', priority: 0.9 },
  ].map((route) => ({ ...route, lastModified: new Date() }));

  const projectRoutes = projects.map((project) => ({
    url: `${site.url}/projects/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: project.videoGroups?.length ? 0.8 : 0.6,
    // Video sitemap entries, so the films can appear in Google video results.
    ...(project.videoGroups?.length && {
      videos: projectVideos(project).map((v) => ({
        title: v.name,
        description: v.description,
        thumbnail_loc: v.thumbnailUrl,
        content_loc: v.contentUrl,
        publication_date: v.uploadDate,
      })),
    }),
  }));

  const serviceRoutes = site.services.map((service) => ({
    url: `${site.url}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const articleRoutes = articles.map((article) => ({
    url: `${site.url}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Only list categories that have at least one article.
  const present = new Set(articles.map((a) => a.category));
  const categoryRoutes = CATEGORIES.filter((c) => present.has(c.slug)).map((c) => ({
    url: `${site.url}/blog?category=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...articleRoutes, ...categoryRoutes];
}
