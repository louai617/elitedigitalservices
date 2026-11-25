import { site } from "./site-config";

const abs = (path) => (path?.startsWith("http") ? path : `${site.url}${path}`);

/** Meta description for a project: its tagline if it has one, else the description. */
export const projectDescription = (project) => project.tagline || project.description;

/** Cover image for a project, absolute, or the site share image. */
export const projectImage = (project) =>
  abs(project.project?.banner || project.project?.images?.[0] || site.ogImage);

/** Every video of a project, flattened, with absolute URLs for schema and sitemaps. */
export function projectVideos(project) {
  return (project.videoGroups || []).flatMap((group) =>
    group.videos.map((video) => ({
      name: `${video.title} — ${group.title}`,
      description: `${video.title}: ${project.title.toLowerCase()} video produced for ${group.title} by ${site.fullName}.`,
      thumbnailUrl: abs(video.poster),
      contentUrl: abs(video.src),
      // Videos carry no dates of their own; the project year is the honest bound.
      uploadDate: `${project.year}-01-01`,
    }))
  );
}

/** JSON-LD for a project page: breadcrumbs, the work itself, and its videos. */
export function projectSchema(project) {
  const url = `${site.url}/projects/${project.slug}`;
  const videos = projectVideos(project);
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: "Work", item: `${site.url}/#projects` },
        { "@type": "ListItem", position: 3, name: project.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.title,
      description: projectDescription(project),
      url,
      image: projectImage(project),
      dateCreated: String(project.year),
      creator: { "@type": "Organization", name: site.name, url: site.url },
      ...(videos.length && {
        hasPart: videos.map((v) => ({ "@type": "VideoObject", ...v })),
      }),
    },
  ];
}
