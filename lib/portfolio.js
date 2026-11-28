import "server-only";
import { projects as builtIn } from "./projects-data";

/**
 * The portfolio shown on the site. Managed in the team CRM
 * (team.elitemedia.qa → Portfolio) and read from its API; the CRM pings
 * /api/revalidate-portfolio after every change, and the site also re-reads
 * every 5 minutes on its own.
 *
 * Without PORTFOLIO_API_URL (local dev, or before the CRM is installed), or
 * if the CRM can't be reached, the built-in list in lib/projects-data.js is
 * used, so the site never shows an empty portfolio.
 */
export const PORTFOLIO_TAG = "portfolio";

export async function getPortfolio() {
  const base = process.env.PORTFOLIO_API_URL;
  if (!base) return builtIn;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/portfolio`, {
      next: { revalidate: 300, tags: [PORTFOLIO_TAG] },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { projects } = await res.json();
    if (!Array.isArray(projects)) throw new Error("bad response");
    return projects;
  } catch (e) {
    console.error(`[portfolio] CRM unavailable (${e.message}); using the built-in list`);
    return builtIn;
  }
}

export async function getPortfolioItem(slug) {
  return (await getPortfolio()).find((p) => p.slug === slug) || null;
}
