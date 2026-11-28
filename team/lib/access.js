import "server-only";
import { notFound } from "next/navigation";
import { db } from "./db";
import { can } from "./permissions";

/** A project the user may see, or 404. Hidden projects look like missing ones. */
export async function getVisibleProject(user, id, include) {
  const project = await db.project.findUnique({
    where: { id },
    include: { members: { select: { userId: true } }, ...include },
  });
  if (!project) notFound();
  if (!can(user, "seeAllProjects") && !project.members.some((m) => m.userId === user.id)) notFound();
  return project;
}

/** Same check without a 404, for actions and API routes. */
export async function canSeeProject(user, projectId) {
  if (user.role === "CLIENT") {
    const p = await db.project.findUnique({ where: { id: projectId }, select: { clientId: true } });
    return !!p && !!user.clientId && p.clientId === user.clientId;
  }
  if (can(user, "seeAllProjects")) return true;
  return !!(await db.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: user.id } } }));
}
