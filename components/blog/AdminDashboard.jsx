'use client';

import { useState } from 'react';
import Link from 'next/link';

function StatusBadge({ status }) {
  const tone =
    status === 'published'
      ? 'border-green-500/40 text-green-400'
      : status === 'scheduled'
        ? 'border-blue-500/40 text-blue-400'
        : 'border-white/20 text-muted-foreground';
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${tone}`}>{status}</span>
  );
}

export default function AdminDashboard({ initialArticles, aiConfig, categories }) {
  const [articles, setArticles] = useState(initialArticles);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [category, setCategory] = useState('');

  const refresh = async () => {
    const res = await fetch('/api/admin/articles', { cache: 'no-store' });
    const data = await res.json();
    setArticles(data.articles || []);
  };

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setNotice({ type: 'info', text: 'Generating — this usually takes 30–90 seconds…' });
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category ? { category } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Generation failed.' });
      } else {
        setNotice({ type: 'success', text: `Published "${data.article.title}".` });
        await refresh();
      }
    } catch (error) {
      setNotice({ type: 'error', text: `Generation failed: ${error.message}` });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (article, status) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setNotice({ type: 'error', text: data.error || 'Update failed.' });
      } else {
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (article) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/articles?slug=${encodeURIComponent(article.slug)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotice({ type: 'success', text: 'Article deleted.' });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Content Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {articles.length} article{articles.length === 1 ? '' : 's'} ·{' '}
            {articles.filter((a) => a.status === 'published').length} published
          </p>
        </header>

        <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">AI generation</h2>

          {aiConfig.configured ? (
            <dl className="mb-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><dt className="text-muted-foreground">Provider</dt><dd className="text-foreground">{aiConfig.provider}</dd></div>
              <div><dt className="text-muted-foreground">Model</dt><dd className="text-foreground">{aiConfig.model}</dd></div>
              <div><dt className="text-muted-foreground">Per day</dt><dd className="text-foreground">{aiConfig.articlesPerDay}</dd></div>
              <div>
                <dt className="text-muted-foreground">Daily cron</dt>
                <dd className={aiConfig.cronConfigured ? 'text-green-400' : 'text-yellow-400'}>
                  {aiConfig.cronConfigured ? 'Configured' : 'CRON_SECRET not set'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mb-5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-300">
              AI is not configured. Set <code>AI_API_KEY</code> in the environment to enable generation.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-muted px-3 py-2 text-sm text-foreground"
            >
              <option value="">Next category (rotating)</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.title}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={generate}
              disabled={busy || !aiConfig.configured}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Generate article now'}
            </button>
          </div>

          {notice && (
            <p
              className={`mt-4 rounded-lg border p-3 text-sm ${
                notice.type === 'error'
                  ? 'border-red-500/30 bg-red-500/5 text-red-300'
                  : notice.type === 'success'
                    ? 'border-green-500/30 bg-green-500/5 text-green-300'
                    : 'border-white/10 bg-white/[0.02] text-muted-foreground'
              }`}
            >
              {notice.text}
            </p>
          )}
        </section>

        <section className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Published</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No articles yet.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.slug} className="border-t border-white/5">
                    <td className="p-4">
                      <Link href={`/blog/${article.slug}`} className="text-foreground hover:text-primary">
                        {article.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">/{article.slug}</p>
                    </td>
                    <td className="p-4 text-muted-foreground">{article.category}</td>
                    <td className="p-4"><StatusBadge status={article.status} /></td>
                    <td className="p-4 text-muted-foreground">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setStatus(article, article.status === 'published' ? 'draft' : 'published')
                          }
                          className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 disabled:opacity-50"
                        >
                          {article.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => remove(article)}
                          className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
