import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { PORTFOLIO_TAG } from "@/lib/portfolio";

/** Called by the team CRM after a portfolio change, so the site updates at once. */
export async function POST(request) {
  const secret = process.env.PORTFOLIO_REVALIDATE_SECRET;
  const given = request.headers.get("x-revalidate-secret") || "";
  const ok = secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return new Response("Forbidden", { status: 403 });
  revalidateTag(PORTFOLIO_TAG);
  revalidatePath("/");
  revalidatePath("/projects/[slug]", "page");
  revalidatePath("/sitemap.xml");
  return Response.json({ revalidated: true });
}
