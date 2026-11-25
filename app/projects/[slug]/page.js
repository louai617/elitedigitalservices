import React from "react";
import Link from "next/link";
import { 
  ArrowLeft
} from "lucide-react";
import { getProjectBySlug, projects } from "@/lib/projects-data";
import ProjectDetailClient from "./ProjectDetailClient";
import { site } from "@/lib/site-config";
import { projectDescription, projectImage, projectSchema } from "@/lib/project-seo";

// Pre-generate all project routes at build time
export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
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
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-8">The project you're looking for doesn't exist.</p>
          <Link 
            href="/#projects" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all"
          >
            <ArrowLeft size={18} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

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

