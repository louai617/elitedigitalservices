import "server-only";
import { db } from "./db";
import { projectScope } from "./permissions";

/** Options for the event form: visible projects, active people, active equipment. */
export async function eventFormOptions(user) {
  const [projects, users, equipment] = await Promise.all([
    db.project.findMany({ where: { ...projectScope(user), status: { not: "DELIVERED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    db.equipment.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }], select: { id: true, name: true, category: true } }),
  ]);
  return { projects, users, equipment };
}
