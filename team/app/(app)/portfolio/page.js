import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Images, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PORTFOLIO_CATEGORIES, publicSiteUrl } from "@/lib/portfolio";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { moveItem, togglePublished } from "./actions";

export const metadata = { title: "Portfolio" };

const thumb = (item, site) => {
  const u = item.banner || item.videoGroups?.[0]?.videos?.[0]?.poster || item.images?.[0];
  if (!u) return null;
  return u.startsWith("/media/portfolio/") || !u.startsWith("/") ? u : `${site}${u}`;
};

export default async function PortfolioPage({ searchParams }) {
  const me = await requireUser();
  if (!can(me, "managePortfolio")) redirect("/");
  const { show = "all" } = await searchParams;
  const site = publicSiteUrl();
  const items = await db.portfolioItem.findMany({
    where: show === "live" ? { published: true } : show === "hidden" ? { published: false } : {},
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { project: { select: { id: true, name: true } } },
  });
  const live = await db.portfolioItem.count({ where: { published: true } });
  const chip = (key, label) => (
    <Link href={`/portfolio?show=${key}`} className={`rounded-full border px-3 py-1 text-xs ${show === key ? "border-gold bg-gold/10 text-gold" : "border-line text-mute hover:text-bone"}`}>{label}</Link>
  );

  return (
    <>
      <PageHeader title="Portfolio" subtitle={`${live} projects live on elitemedia.qa · order here = order on the website`}>
        <a href={`${site}/#projects`} target="_blank" className="btn btn-ghost">View website</a>
        <Link href="/portfolio/new" className="btn btn-primary"><Plus size={16} />New portfolio item</Link>
      </PageHeader>
      <div className="mb-5 flex gap-2">{chip("all", "All")}{chip("live", "Live")}{chip("hidden", "Hidden")}</div>

      {items.length === 0 ? (
        <div className="card"><Empty icon={Images} title="Nothing here">Add your best work with “New portfolio item”.</Empty></div>
      ) : (
        <ul className="card divide-y divide-line">
          {items.map((item, i) => {
            const src = thumb(item, site);
            const videos = (item.videoGroups || []).reduce((n, g) => n + g.videos.length, 0);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-5">
                {show === "all" && (
                  <div className="flex flex-col">
                    <form action={moveItem}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="dir" value="up" /><button disabled={i === 0} className="rounded p-1 text-mute hover:text-gold disabled:opacity-20" aria-label="Move up"><ArrowUp size={14} /></button></form>
                    <form action={moveItem}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="dir" value="down" /><button disabled={i === items.length - 1} className="rounded p-1 text-mute hover:text-gold disabled:opacity-20" aria-label="Move down"><ArrowDown size={14} /></button></form>
                  </div>
                )}
                <Link href={`/portfolio/${item.id}`} className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-ink ring-1 ring-line">
                  {src && <img src={src} alt="" loading="lazy" className={`h-full w-full object-cover ${item.published ? "" : "opacity-40 grayscale"}`} />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/portfolio/${item.id}`} className="block truncate font-medium hover:text-gold">{item.title}</Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
                    <span>{PORTFOLIO_CATEGORIES[item.category] || item.category}</span>
                    {item.year && <span>{item.year}</span>}
                    {videos > 0 && <span>{videos} video{videos > 1 ? "s" : ""}</span>}
                    {item.images.length > 0 && <span>{item.images.length} image{item.images.length > 1 ? "s" : ""}</span>}
                    {item.project && <Link href={`/projects/${item.project.id}`} className="text-gold hover:underline">CRM: {item.project.name}</Link>}
                  </p>
                </div>
                {item.published ? <Badge tone="green">Live</Badge> : <Badge tone="slate">Hidden</Badge>}
                <form action={togglePublished}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="published" value={String(!item.published)} />
                  <button className="btn btn-ghost btn-sm">{item.published ? <><EyeOff size={13} />Hide</> : <><Eye size={13} />Publish</>}</button>
                </form>
                {item.published && <a href={`${site}/projects/${item.slug}`} target="_blank" className="hidden text-xs text-mute hover:text-gold sm:block">View ↗</a>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
