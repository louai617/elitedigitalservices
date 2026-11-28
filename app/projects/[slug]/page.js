import { notFound } from "next/navigation";
import { getPortfolio, getPortfolioItem } from "@/lib/portfolio";
import ProjectDetailClient from "./ProjectDetailClient";
import { site } from "@/lib/site-config";
import { projectDescription, projectImage, projectSchema } from "@/lib/project-seo";

// Pre-render the portfolio at build time; items published later in the CRM
// render on first visit (dynamicParams) and are then cached.
export async function generateStaticParams() {
  return (await getPortfolio()).map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getPortfolioItem(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };

  const service = project.service.split("-").join(" ");
  const title = project.videoGroups?.length
    ? `${project.title} Video Production in Qatar`
    : `${project.title} — ${service.replace(/\b\w/g, (c) => c.toUpperCase())} Project`;
  const description = projectDescription(project);
  const image = projectImage(project);
  return {
    title,
    description,
    // Without this, the layout's canonical ("/") would mark every project
    // page as a copy of the home page.
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "website",
      url: `${site.url}/projects/${project.slug}`,
      siteName: site.name,
      title: `${title} | ${site.shortName}`,
      description,
      images: [{ url: image, alt: project.title }],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${site.shortName}`, description, images: [image] },
  };
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const project = await getPortfolioItem(slug);
  if (!project) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema(project)) }}
      />
      <ProjectDetailClient project={project} />
    </>
  );
}

