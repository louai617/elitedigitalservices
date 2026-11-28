import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PORTFOLIO_CATEGORIES, publicSiteUrl } from "@/lib/portfolio";
import { linkableProjects } from "@/lib/portfolio-form-data";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/client-ui";
import PortfolioEditor from "../PortfolioEditor";
import { deletePortfolioItem } from "../actions";

export const metadata = { title: "Edit portfolio item" };

export default async function EditPortfolioItem({ params, searchParams }) {
  const me = await requireUser();
  if (!can(me, "managePortfolio")) redirect("/");
  const { id } = await params;
  const { saved } = await searchParams;
  const item = await db.portfolioItem.findUnique({ where: { id } });
  if (!item) notFound();
  return (
    <>
      <Link href="/portfolio" className="text-sm text-mute hover:text-gold">← Portfolio</Link>
      <PageHeader title={item.title} subtitle={item.published ? "Live on the website" : "Hidden from the website"} />
      <div className="max-w-5xl">
        <PortfolioEditor key={item.updatedAt.toISOString()} item={JSON.parse(JSON.stringify(item))} categories={PORTFOLIO_CATEGORIES} projects={await linkableProjects()} siteUrl={publicSiteUrl()} saved={!!saved} />
        <Card title="Delete" className="mt-6">
          <form action={deletePortfolioItem} className="flex flex-wrap items-center justify-between gap-3">
            <input type="hidden" name="id" value={item.id} />
            <p className="text-sm text-mute">Removes it from the website and deletes files uploaded for it. To just take it down, untick “Show on website”.</p>
            <ConfirmButton message={`Delete “${item.title}” from the portfolio?`} className="btn btn-danger">Delete</ConfirmButton>
          </form>
        </Card>
      </div>
    </>
  );
}
