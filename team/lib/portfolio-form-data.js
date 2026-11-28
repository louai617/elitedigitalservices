import "server-only";
import { db } from "./db";

/** CRM projects to link a portfolio item to. */
export async function linkableProjects() {
  const ps = await db.project.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, name: true, client: { select: { name: true } } } });
  return ps.map((p) => ({ id: p.id, name: p.name, client: p.client?.name || null }));
}
