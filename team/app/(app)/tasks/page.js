import Link from "next/link";
import { ListChecks } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, canEditTask, projectScope } from "@/lib/permissions";
import { Empty, PageHeader } from "@/components/ui";
import KanbanBoard from "@/components/KanbanBoard";

export const metadata = { title: "My tasks" };

export default async function TasksPage({ searchParams }) {
  const me = await requireUser();
  const { who } = await searchParams;
  // Managers can switch to everyone's tasks or one person's.
  const manager = can(me, "manageAnyTask");
  const assigneeFilter = !manager || !who ? { assigneeId: me.id } : who === "all" ? {} : { assigneeId: who };

  const [tasks, people] = await Promise.all([
    db.task.findMany({
      where: { ...assigneeFilter, project: projectScope(me), OR: [{ status: { not: "DONE" } }, { updatedAt: { gte: new Date(Date.now() - 14 * 864e5) } }] },
      orderBy: [{ priority: "desc" }, { dueDate: { sort: "asc", nulls: "last" } }],
      include: { project: { select: { name: true } }, assignee: { select: { id: true, name: true, color: true } }, _count: { select: { comments: true } } },
    }),
    manager ? db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : [],
  ]);

  const boardTasks = tasks.map((t) => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate,
    assignee: t.assignee, comments: t._count.comments, projectName: t.project.name,
  }));
  const title = !who ? "My tasks" : who === "all" ? "All tasks" : `${people.find((p) => p.id === who)?.name || "Someone"}'s tasks`;

  return (
    <>
      <PageHeader title={title} subtitle="Open tasks, plus anything finished in the last two weeks">
        {manager && (
          <div className="flex flex-wrap gap-2">
            <Link href="/tasks" className={`rounded-full border px-3 py-1 text-xs ${!who ? "border-gold bg-gold/10 text-gold" : "border-line text-mute"}`}>Mine</Link>
            <Link href="/tasks?who=all" className={`rounded-full border px-3 py-1 text-xs ${who === "all" ? "border-gold bg-gold/10 text-gold" : "border-line text-mute"}`}>Everyone</Link>
            <form action="/tasks" className="flex">
              <select name="who" defaultValue={who && who !== "all" ? who : ""} className="input py-1 text-xs" aria-label="Person">
                <option value="" disabled>Person…</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm ml-1">Go</button>
            </form>
          </div>
        )}
      </PageHeader>
      {tasks.length === 0 ? (
        <div className="card"><Empty icon={ListChecks} title="Nothing on your plate">Tasks assigned to you show up here.</Empty></div>
      ) : (
        <KanbanBoard tasks={boardTasks} editableIds={tasks.filter((t) => canEditTask(me, t)).map((t) => t.id)} showProject />
      )}
    </>
  );
}
