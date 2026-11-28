import "server-only";
import path from "node:path";
import { mkdir, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db } from "./db";

const run = promisify(execFile);

/** Website filter categories (match lib/projects-data.js `filters` on the site). */
export const PORTFOLIO_CATEGORIES = {
  web: "Web Development",
  ecommerce: "E-commerce",
  mobile: "Mobile Development",
  ai: "AI & Machine Learning",
  design: "Design & Branding",
  video: "Video Production",
  blockchain: "Web3 & Blockchain",
  automation: "Automation & Tools",
};

/**
 * Uploaded portfolio media lives in the website's media folder, which nginx
 * serves at elitemedia.qa/media/ — so the site loads it straight from disk.
 * The team app serves the same files at /media/portfolio/ for previews.
 */
export const PORTFOLIO_MEDIA_DIR = path.resolve(process.env.PORTFOLIO_MEDIA_DIR || "./portfolio-media");
export const PUBLIC_PREFIX = "/media/portfolio/";

export async function ensurePortfolioDir() {
  await mkdir(PORTFOLIO_MEDIA_DIR, { recursive: true });
  return PORTFOLIO_MEDIA_DIR;
}

/** Delete an uploaded file we own; external URLs and site assets are left alone. */
export async function removeOwnedMedia(url) {
  if (url?.startsWith(PUBLIC_PREFIX)) {
    await unlink(path.join(PORTFOLIO_MEDIA_DIR, path.basename(url))).catch(() => {});
  }
}

/**
 * Make an uploaded video start instantly on the web (index moved to the front,
 * no re-encode) and grab a poster frame. Skipped quietly without ffmpeg.
 */
export async function prepareVideo(file) {
  const out = file.replace(/\.[^.]+$/, "") + ".web.mp4";
  const poster = file.replace(/\.[^.]+$/, "") + ".jpg";
  try {
    await run("ffmpeg", ["-nostdin", "-loglevel", "error", "-y", "-i", file, "-c", "copy", "-movflags", "+faststart", out], { timeout: 600000 });
    await unlink(file);
    await run("ffmpeg", ["-nostdin", "-loglevel", "error", "-y", "-ss", "2", "-i", out, "-vf", "thumbnail=60,scale=1280:-2", "-frames:v", "1", "-q:v", "4", poster], { timeout: 120000 });
    return { video: out, poster };
  } catch {
    return { video: (await exists(out)) ? out : file, poster: (await exists(poster)) ? poster : null };
  }
}
const exists = async (p) => !!(await import("node:fs/promises").then((fs) => fs.stat(p)).catch(() => null));

/** Shape the website expects for one project (see lib/projects-data.js there). */
export function toWebsiteProject(item) {
  return {
    slug: item.slug,
    title: item.title,
    category: item.category,
    service: item.service,
    github: item.github || "",
    year: item.year,
    link: item.link || "",
    tech: item.tech,
    result: item.result || "",
    description: item.description,
    content: item.content || "",
    ...(item.tagline && { tagline: item.tagline }),
    ...(item.ctaTitle && { ctaTitle: item.ctaTitle }),
    ...(Array.isArray(item.highlights) && item.highlights.length && { highlights: item.highlights }),
    project: { banner: item.banner || "", images: item.images },
    ...(Array.isArray(item.videoGroups) && item.videoGroups.length && { videoGroups: item.videoGroups }),
  };
}

/**
 * Tell the website to refresh its portfolio now instead of within 5 minutes.
 * Best effort: the site re-reads on its own anyway.
 */
export async function refreshWebsite() {
  const url = process.env.WEBSITE_REVALIDATE_URL, secret = process.env.PORTFOLIO_REVALIDATE_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(url, { method: "POST", headers: { "x-revalidate-secret": secret }, signal: AbortSignal.timeout(5000) });
  } catch {}
}

export const publicSiteUrl = () => (process.env.PUBLIC_SITE_URL || "https://elitemedia.qa").replace(/\/$/, "");

/** Published items in website order. */
export const publishedItems = () =>
  db.portfolioItem.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
