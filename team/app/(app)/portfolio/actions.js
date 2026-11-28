"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { db } from "@/lib/db";
import { requireCan, str } from "@/lib/guard";
import { PORTFOLIO_CATEGORIES, PUBLIC_PREFIX, ensurePortfolioDir, prepareVideo, refreshWebsite, removeOwnedMedia } from "@/lib/portfolio";

const IMAGE = /^image\/(jpeg|png|webp|gif|avif)$/;
const VIDEO = /^video\/(mp4|quicktime|webm)$/;

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "project";

function parseJson(v, fallback) {
  try {
    const x = JSON.parse(String(v || ""));
    return x ?? fallback;
  } catch {
    return fallback;
  }
}

/** Only keep well-formed URLs: our uploads, site paths, or http(s). */
const cleanUrl = (u) => (typeof u === "string" && /^(\/[^\s]*|https?:\/\/[^\s]+)$/.test(u.trim()) ? u.trim() : null);

function cleanGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups
    .map((g) => ({
      title: String(g?.title || "").trim().slice(0, 120),
      videos: (Array.isArray(g?.videos) ? g.videos : [])
        .map((v) => ({
          title: String(v?.title || "").trim().slice(0, 120) || "Untitled",
          src: cleanUrl(v?.src),
          poster: cleanUrl(v?.poster) || undefined,
          fallbacks: (Array.isArray(v?.fallbacks) ? v.fallbacks : []).map(cleanUrl).filter(Boolean),
        }))
        .filter((v) => v.src),
    }))
    .filter((g) => g.videos.length);
}

/**
 * Uploads from the editor (cover, gallery, videos). Returns the public paths;
 * the item itself is saved separately with the rest of the form.
 */
export async function uploadPortfolioMedia(fd) {
  await requireCan("managePortfolio");
  const dir = await ensurePortfolioDir();
  const out = [];
  for (const file of fd.getAll("files")) {
    if (!(file instanceof File) || !file.size) continue;
    const isImage = IMAGE.test(file.type), isVideo = VIDEO.test(file.type);
    if (!isImage && !isVideo) return { error: `${file.name}: use JPG, PNG, WebP or GIF images, or MP4/MOV/WebM videos.` };
    const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm" }[file.type];
    const target = path.join(dir, `${randomUUID()}${ext}`);
    await pipeline(Readable.fromWeb(file.stream()), createWriteStream(target));
    if (isVideo) {
      const { video, poster } = await prepareVideo(target);
      out.push({ kind: "video", name: file.name, src: PUBLIC_PREFIX + path.basename(video), poster: poster ? PUBLIC_PREFIX + path.basename(poster) : undefined });
    } else {
      out.push({ kind: "image", name: file.name, src: PUBLIC_PREFIX + path.basename(target) });
    }
  }
  return { files: out };
}

export async function savePortfolioItem(_prev, fd) {
  await requireCan("managePortfolio");
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Give it a title." };
  const slug = slugify(str(fd, "slug") || title);
  const category = str(fd, "category");
  if (!PORTFOLIO_CATEGORIES[category]) return { error: "Choose a category." };
  const clash = await db.portfolioItem.findUnique({ where: { slug } });
  if (clash && clash.id !== id) return { error: `The web address “${slug}” is already used by “${clash.title}”.` };

  const projectId = str(fd, "projectId");
  if (projectId) {
    const linked = await db.portfolioItem.findUnique({ where: { projectId } });
    if (linked && linked.id !== id) return { error: `That CRM project is already linked to “${linked.title}”.` };
  }

  const data = {
    slug, title, category,
    service: str(fd, "service") || "",
    year: str(fd, "year") || String(new Date().getFullYear()),
    description: str(fd, "description") || "",
    tagline: str(fd, "tagline"),
    content: str(fd, "content"),
    result: str(fd, "result"),
    link: cleanUrl(str(fd, "link")),
    github: cleanUrl(str(fd, "github")),
    tech: (str(fd, "tech") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30),
    banner: cleanUrl(str(fd, "banner")),
    images: parseJson(fd.get("images"), []).map(cleanUrl).filter(Boolean).slice(0, 60),
    videoGroups: cleanGroups(parseJson(fd.get("videoGroups"), [])),
    published: fd.get("published") === "on",
    projectId,
  };

  let item;
  if (id) {
    const before = await db.portfolioItem.findUnique({ where: { id } });
    if (!before) return { error: "Not found." };
    item = await db.portfolioItem.update({ where: { id }, data });
    // Clean up uploads that were removed in the editor.
    const keep = new Set([data.banner, ...data.images, ...data.videoGroups.flatMap((g) => g.videos.flatMap((v) => [v.src, v.poster]))]);
    const was = [before.banner, ...before.images, ...(before.videoGroups || []).flatMap((g) => g.videos.flatMap((v) => [v.src, v.poster]))];
    await Promise.all(was.filter((u) => u && !keep.has(u)).map(removeOwnedMedia));
  } else {
    const last = await db.portfolioItem.aggregate({ _max: { sortOrder: true } });
    item = await db.portfolioItem.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  }
  await refreshWebsite();
  revalidatePath("/portfolio");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect(`/portfolio/${item.id}?saved=1`);
}

export async function togglePublished(fd) {
  await requireCan("managePortfolio");
  const id = String(fd.get("id"));
  await db.portfolioItem.update({ where: { id }, data: { published: fd.get("published") === "true" } });
  await refreshWebsite();
  revalidatePath("/portfolio");
}

/** Move an item one place up or down in the website order. */
export async function moveItem(fd) {
  await requireCan("managePortfolio");
  const id = String(fd.get("id"));
  const dir = fd.get("dir") === "up" ? -1 : 1;
  const items = await db.portfolioItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const i = items.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  await db.$transaction(items.map((x, n) => db.portfolioItem.update({ where: { id: x.id }, data: { sortOrder: n } })));
  await refreshWebsite();
  revalidatePath("/portfolio");
}

export async function deletePortfolioItem(fd) {
  await requireCan("managePortfolio");
  const item = await db.portfolioItem.findUnique({ where: { id: String(fd.get("id")) } });
  if (!item) redirect("/portfolio");
  await db.portfolioItem.delete({ where: { id: item.id } });
  const media = [item.banner, ...item.images, ...(item.videoGroups || []).flatMap((g) => g.videos.flatMap((v) => [v.src, v.poster]))];
  await Promise.all(media.map(removeOwnedMedia));
  await refreshWebsite();
  redirect("/portfolio");
}
