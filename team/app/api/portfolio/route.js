import { publishedItems, toWebsiteProject } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/**
 * The public portfolio, read by elitemedia.qa. Only published items, and
 * only what the website shows anyway — nothing internal.
 */
export async function GET() {
  const items = await publishedItems();
  return Response.json(
    { projects: items.map(toWebsiteProject) },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
