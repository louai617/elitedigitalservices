import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { getVisibleProject } from "@/lib/access";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/client-ui";
import ProjectForm from "../../ProjectForm";
import { deleteProject, updateProject } from "../../actions";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }) {
  const { id } = await params;
  const me = await requireUser();
  if (!can(me, "editProject")) redirect(`/projects/${id}`);
  const project = await getVisibleProject(me, id);
  const [clients, users] = await Promise.all([
    db.client.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, title: true, color: true } }),
  ]);
  return (
    <>
      <PageHeader title={`Edit ${project.name}`} />
      <Card className="max-w-4xl">
        <ProjectForm action={updateProject} project={project} clients={clients} users={users} memberIds={project.members.map((m) => m.userId)} />
      </Card>
      {can(me, "deleteProject") && (
        <Card title="Danger zone" className="mt-6 max-w-4xl">
          <form action={deleteProject} className="flex flex-wrap items-center justify-between gap-3">
            <input type="hidden" name="id" value={project.id} />
            <p className="text-sm text-mute">Deletes the project with its tasks, files, comments and time entries.</p>
            <ConfirmButton message={`Delete "${project.name}" and everything in it? This cannot be undone.`} className="btn btn-danger">Delete project</ConfirmButton>
          </form>
        </Card>
      )}
    </>
  );
}
