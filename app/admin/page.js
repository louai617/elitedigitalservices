import AdminDashboard from '@/components/blog/AdminDashboard';
import { getAllArticles, isStorageWritable } from '@/lib/blog/store';
import { isAIConfigured, getAIConfig } from '@/lib/blog/ai-provider';
import { CATEGORIES } from '@/lib/blog/schema';

export const dynamic = 'force-dynamic';
// Never let the admin surface be indexed, even if the auth layer is misconfigured.
export const metadata = { title: 'Content Admin', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const articles = await getAllArticles({ fresh: true });

  const aiConfig = {
    configured: isAIConfigured(),
    // Surfaced here because a read-only host silently breaks generation, and
    // the dashboard is where that needs to be visible before it is relied on.
    storageWritable: await isStorageWritable(),
  };

  if (aiConfig.configured) {
    const cfg = getAIConfig();
    Object.assign(aiConfig, {
      provider: cfg.provider,
      model: cfg.model,
      articlesPerDay: Number(process.env.BLOG_ARTICLES_PER_DAY || 1),
      maxWords: Number(process.env.BLOG_MAX_WORDS || 1100),
      cronConfigured: Boolean(process.env.CRON_SECRET),
    });
  }

  return <AdminDashboard initialArticles={articles} aiConfig={aiConfig} categories={CATEGORIES} />;
}
