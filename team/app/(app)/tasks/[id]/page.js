import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, canEditTask } from "@/lib/permissions";
import { canSeeProject } from "@/lib/access";
import { PRIORITY, TASK_STATUS, dohaDay, fmtDate, fmtDateTime, fmtHours } from "@/lib/format";
import { Avatar, Card, Field, StatusBadge } from "@/components/ui";
import { ConfirmButton, SubmitButton } from "@/components/client-ui";
import { addTaskComment, deleteTask, updateTask } from "../../projects/actions";

export const metadata = { title: "Task" };
const userSel = { select: { id: true, name: true, color: true } };

export default async function TaskPage({ params }) {
  const { id } = await params;
  const me = await requireUser();
  const task = await db.task.findUnique({
    where: { id },
    include: {
      project: { include: { members: { include: { user: userSel } } } },
      assignee: userSel,
      createdBy: userSel,
      comments: { orderBy: { createdAt: "asc" }, include: { author: userSel } },
      timeEntries: { select: { minutes: true } },
    },
  });
  if (!task || !(await canSeeProject(me, task.projectId))) notFound();

  const editable = canEditTask(me, task);
  const manager = can(me, "manageAnyTask");
  const minutes = task.timeEntries.reduce((s, t) => s + t.minutes, 0);

  return (
    <>
      <Link href={`/projects/${task.projectId}`} className="text-sm text-mute hover:text-gold">← {task.project.name}</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge map={TASK_STATUS} value={task.status} />
              <StatusBadge map={PRIORITY} value={task.priority} />
            </div>
            <h1 className="mt-3 text-2xl font-bold">{task.title}</h1>
            <p className="mt-1 text-sm text-mute">Created by {task.createdBy.name} · {fmtDateTime(task.createdAt)}</p>
          </div>
          {task.description && <Card><p className="whitespace-pre-wrap text-sm leading-relaxed text-mute">{task.description}</p></Card>}

          <Card title={`Comments · ${task.comments.length}`}>
            <div className="space-y-4">
              {task.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar user={c.author} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><span className="font-medium">{c.author.name}</span> <span className="text-xs text-mute">{fmtDateTime(c.createdAt)}</span></p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-mute">{c.body}</p>
                  </div>
                </div>
              ))}
              <form action={addTaskComment} className="space-y-2">
                <input type="hidden" name="taskId" value={task.id} />
                <textarea name="body" required rows={2} placeholder="Write an update or ask a question…" className="input" />
                <SubmitButton className="btn btn-primary btn-sm">Comment</SubmitButton>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {editable ? (
            <Card title="Edit task">
              <form action={updateTask} className="space-y-3">
                <input type="hidden" name="id" value={task.id} />
                <Field label="Title"><input name="title" defaultValue={task.title} className="input" /></Field>
                <Field label="Details"><textarea name="description" rows={3} defaultValue={task.description || ""} className="input" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status">
                    <select name="status" defaultValue={task.status} className="input">{Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                  </Field>
                  <Field label="Priority">
                    <select name="priority" defaultValue={task.priority} className="input">{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                  </Field>
                </div>
                {manager && (
                  <Field label="Assignee">
                    <select name="assigneeId" defaultValue={task.assigneeId || ""} className="input">
                      <option value="">Unassigned</option>
                      {task.project.members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Due date"><input type="date" name="dueDate" defaultValue={task.dueDate ? dohaDay(task.dueDate) : ""} className="input" /></Field>
                <SubmitButton className="btn btn-primary btn-sm">Save</SubmitButton>
              </form>
            </Card>
          ) : (
            <Card title="Details">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-mute">Due</dt><dd>{fmtDate(task.dueDate)}</dd></div>
              </dl>
            </Card>
          )}
          <Card title="People & time">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><dt className="text-mute">Assignee</dt><dd className="flex items-center gap-2">{task.assignee ? <><Avatar user={task.assignee} size={22} />{task.assignee.name}</> : "Unassigned"}</dd></div>
              <div className="flex justify-between"><dt className="text-mute">Time logged</dt><dd>{fmtHours(minutes)}</dd></div>
            </dl>
            <Link href={`/time?project=${task.projectId}&task=${task.id}`} className="btn btn-ghost btn-sm mt-4 w-full">Log time on this task</Link>
          </Card>
          {(manager || task.createdById === me.id) && (
            <form action={deleteTask}>
              <input type="hidden" name="id" value={task.id} />
              <ConfirmButton message="Delete this task and its comments?" className="btn btn-danger w-full">Delete task</ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
