import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PORTFOLIO_CATEGORIES, publicSiteUrl } from "@/lib/portfolio";
import { linkableProjects } from "@/lib/portfolio-form-data";
import { PageHeader } from "@/components/ui";
import PortfolioEditor from "../PortfolioEditor";

export const metadata = { title: "New portfolio item" };

// CRM service → website category, for items started from a project.
const CATEGORY_FOR = { PROGRAMMING: "web", PHOTOGRAPHY: "design", VIDEOGRAPHY: "video", DESIGN: "design", BRANDING: "design", MARKETING: "web" };
const SERVICE_FOR = { PROGRAMMING: "web-development", PHOTOGRAPHY: "photography", VIDEOGRAPHY: "video-production", DESIGN: "graphic-design", BRANDING: "brand-identity-design", MARKETING: "digital-marketing" };

export default async function NewPortfolioItem({ searchParams }) {
  const me = await requireUser();
  if (!can(me, "managePortfolio")) redirect("/");
  const { project: projectId } = await searchParams;
  let draft = null;
  if (projectId) {
    const existing = await db.portfolioItem.findUnique({ where: { projectId } });
    if (existing) redirect(`/portfolio/${existing.id}`);
    const p = await db.project.findUnique({ where: { id: projectId }, include: { client: true } });
    if (p) {
      draft = {
        title: p.client ? `${p.client.company || p.client.name} — ${p.name}` : p.name,
        category: CATEGORY_FOR[p.service] || "",
        service: SERVICE_FOR[p.service] || "",
        year: String((p.dueDate || new Date()).getFullYear()),
        description: p.description?.split("\n")[0].slice(0, 300) || "",
        projectId: p.id,
        tech: [], images: [], videoGroups: [],
      };
    }
  }
  return (
    <>
      <PageHeader title="New portfolio item" subtitle={draft ? "Started from the CRM project — add the cover, images or videos" : "Add a project to the public portfolio"} />
      <div className="max-w-5xl">
        <PortfolioEditor item={draft} categories={PORTFOLIO_CATEGORIES} projects={await linkableProjects()} siteUrl={publicSiteUrl()} />
      </div>
    </>
  );
}
