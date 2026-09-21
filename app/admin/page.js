import AdminDashboard from '@/components/blog/AdminDashboard';
import { getAllArticles } from '@/lib/blog/store';
import { isAIConfigured, getAIConfig } from '@/lib/blog/ai-provider';
import { CATEGORIES } from '@/lib/blog/schema';

export const dynamic = 'force-dynamic';
// Never let the admin surface be indexed, even if the auth layer is misconfigured.
export const metadata = { title: 'Content Admin', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const articles = await getAllArticles({ fresh: true });

  let aiConfig = { configured: false };
  if (isAIConfigured()) {
    const cfg = getAIConfig();
    aiConfig = {
      configured: true,
      provider: cfg.provider,
      model: cfg.model,
      articlesPerDay: Number(process.env.BLOG_ARTICLES_PER_DAY || 1),
      maxWords: Number(process.env.BLOG_MAX_WORDS || 1100),
      cronConfigured: Boolean(process.env.CRON_SECRET),
    };
  }

  return <AdminDashboard initialArticles={articles} aiConfig={aiConfig} categories={CATEGORIES} />;
}
