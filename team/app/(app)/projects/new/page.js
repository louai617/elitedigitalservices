import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Card, PageHeader } from "@/components/ui";
import ProjectForm from "../ProjectForm";
import { createProject } from "../actions";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const me = await requireUser();
  if (!can(me, "createProject")) redirect("/projects");
  const [clients, users] = await Promise.all([
    db.client.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({ where: { active: true, role: { not: "CLIENT" } }, orderBy: { name: "asc" }, select: { id: true, name: true, title: true, color: true } }),
  ]);
  return (
    <>
      <PageHeader title="New project" />
      <Card className="max-w-4xl"><ProjectForm action={createProject} clients={clients} users={users} memberIds={[me.id]} /></Card>
    </>
  );
}
