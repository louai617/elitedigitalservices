import Link from "next/link";
import { CalendarClock, Camera, Clock, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, canEditTask } from "@/lib/permissions";
import { getVisibleProject } from "@/lib/access";
import { CLIENT_DECISION, EVENT_TYPES, PROJECT_STATUS, SERVICE_LABELS, fmtDate, fmtDateTime, fmtHours } from "@/lib/format";
import { Avatar, Badge, Card, Empty, StatusBadge } from "@/components/ui";
import KanbanBoard from "@/components/KanbanBoard";
import NewTaskForm from "@/components/NewTaskForm";
import FilesPanel from "@/components/FilesPanel";
import MessageThread from "@/components/MessageThread";
import { sendProjectMessage, setProjectStatus } from "../actions";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await db.project.findUnique({ where: { id }, select: { name: true } });
  return { title: p?.name || "Project" };
}

const userSel = { select: { id: true, name: true, color: true, title: true, role: true } };

export default async function ProjectPage({ params, searchParams }) {
  const { id } = await params;
  const { tab = "board" } = await searchParams;
  const me = await requireUser();
  const project = await getVisibleProject(me, id, {
    client: true,
    members: { include: { user: userSel } },
  });

  const [tasks, files, events, time, reviewCount] = await Promise.all([
    db.task.findMany({
      where: { projectId: id },
      orderBy: [{ priority: "desc" }, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      include: { assignee: userSel, _count: { select: { comments: true } } },
    }),
    tab === "files"
      ? db.projectFile.findMany({
          where: { projectId: id },
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: userSel, reviewedBy: userSel, comments: { orderBy: { createdAt: "asc" }, include: { author: userSel } } },
        })
      : [],
    db.event.findMany({ where: { projectId: id, end: { gte: new Date() } }, orderBy: { start: "asc" }, take: 5 }),
    db.timeEntry.groupBy({ by: ["userId"], where: { projectId: id }, _sum: { minutes: true } }),
    db.projectFile.count({ where: { projectId: id, status: "IN_REVIEW" } }),
  ]);
  const [messages, portalUsers, clientFiles] = tab === "client"
    ? await Promise.all([
        db.projectMessage.findMany({ where: { projectId: id }, orderBy: { createdAt: "asc" }, include: { author: userSel } }),
        project.clientId ? db.user.findMany({ where: { clientId: project.clientId, role: "CLIENT", active: true }, select: { name: true, email: true } }) : [],
        db.projectFile.findMany({ where: { projectId: id, sharedWithClient: true }, orderBy: { sharedAt: "desc" }, select: { id: true, name: true, clientStatus: true, clientDecidedAt: true } }),
      ])
    : [[], [], []];
  const clientMessages = await db.projectMessage.count({ where: { projectId: id, author: { role: "CLIENT" } } });

  const members = project.members.map((m) => m.user);
  const totalMinutes = time.reduce((s, t) => s + (t._sum.minutes || 0), 0);
  const done = tasks.filter((t) => t.status === "DONE").length;
  const boardTasks = tasks.map((t) => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate, clientVisible: t.clientVisible,
    assignee: t.assignee, comments: t._count.comments,
  }));
  const editableIds = tasks.filter((t) => canEditTask(me, t)).map((t) => t.id);

  const tabs = [
    ["board", `Board · ${tasks.length}`],
    ["files", `Files & approvals${reviewCount ? ` · ${reviewCount}` : ""}`],
    ["client", `Client${clientMessages ? ` · ${clientMessages}` : ""}`],
    ["overview", "Overview"],
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-mute hover:text-gold">← Projects</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold">{SERVICE_LABELS[project.service]}{project.client && <span className="text-mute"> · {project.client.name}</span>}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-mute">
              <StatusBadge map={PROJECT_STATUS} value={project.status} />
              {project.dueDate && <span className="inline-flex items-center gap-1"><CalendarClock size={14} />Due {fmtDate(project.dueDate)}</span>}
              <span>{done}/{tasks.length} tasks done</span>
              <span className="inline-flex items-center gap-1"><Clock size={14} />{fmtHours(totalMinutes)} logged</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">{members.slice(0, 6).map((u) => <Avatar key={u.id} user={u} size={32} />)}</div>
            {can(me, "editProject") && (
              <>
                <form action={setProjectStatus} className="flex">
                  <input type="hidden" name="id" value={project.id} />
                  <select name="status" defaultValue={project.status} className="input py-1.5 text-sm" aria-label="Project status">
                    {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-sm ml-2">Set</button>
                </form>
                <Link href={`/projects/${project.id}/edit`} className="btn btn-ghost btn-sm"><Pencil size={14} />Edit</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([key, label]) => (
          <Link key={key} href={`/projects/${id}?tab=${key}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition ${tab === key ? "border-gold font-semibold text-gold" : "border-transparent text-mute hover:text-bone"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === "board" && (
        <>
          <NewTaskForm projectId={id} members={members} canAssign={can(me, "manageAnyTask")} meId={me.id} />
          <KanbanBoard tasks={boardTasks} editableIds={editableIds} />
        </>
      )}

      {tab === "files" && (
        <FilesPanel projectId={id} files={files} me={me} canReview={can(me, "reviewFiles")} canShare={can(me, "reviewFiles") || can(me, "editProject")} hasClient={!!project.clientId} />
      )}

      {tab === "client" && (
        !project.clientId ? (
          <Card><p className="text-sm text-mute">This project has no client. Set one with “Edit” to open a client portal for it.</p></Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card title={`Conversation with ${project.client.name}`}>
              <MessageThread
                messages={messages}
                action={sendProjectMessage}
                projectId={id}
                meId={me.id}
                placeholder={`Message ${project.client.name} — they'll see it in their portal`}
                emptyText="No messages yet. Anything written here is visible to the client."
              />
            </Card>
            <div className="space-y-6">
              <Card title="What the client sees">
                <ul className="space-y-2 text-sm text-mute">
                  <li>• Status: <span className="text-bone">{PROJECT_STATUS[project.status].label}</span>, deadline, overall progress</li>
                  <li>• Milestones: <span className="text-bone">{tasks.filter((t) => t.clientVisible).length}</span> task{tasks.filter((t) => t.clientVisible).length === 1 ? "" : "s"} marked with <span className="text-gold">👁</span></li>
                  <li>• Upcoming shoots and meetings on this project</li>
                  <li>• Files you share from “Files & approvals”, which they can approve</li>
                  <li>• This conversation</li>
                </ul>
                <p className="mt-3 text-xs text-mute/70">Internal tasks, comments, time and unshared files stay private.</p>
              </Card>
              <Card title="Shared deliverables" bodyClass="">
                {clientFiles.length === 0 ? <p className="px-5 py-4 text-sm text-mute">Nothing shared yet.</p> : (
                  <ul className="divide-y divide-line">
                    {clientFiles.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 px-5 py-3 text-sm">
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <StatusBadge map={CLIENT_DECISION} value={f.clientStatus || "PENDING"} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Portal logins">
                {portalUsers.length === 0
                  ? <p className="text-sm text-mute">Nobody at {project.client.name} can sign in yet. <Link href="/clients" className="text-gold hover:underline">Add a login</Link>.</p>
                  : <ul className="space-y-1 text-sm">{portalUsers.map((u) => <li key={u.email}>{u.name} <span className="text-mute">· {u.email}</span></li>)}</ul>}
              </Card>
            </div>
          </div>
        )
      )}

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card title="Brief">
              {project.description ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-mute">{project.description}</p> : <p className="text-sm text-mute">No brief yet.</p>}
            </Card>
            <Card title="Upcoming" bodyClass="">
              {events.length === 0 ? <Empty icon={Camera} title="Nothing scheduled">Add a shoot or meeting from the calendar.</Empty> : (
                <ul className="divide-y divide-line">
                  {events.map((e) => (
                    <li key={e.id}><Link href={`/calendar/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                      <Badge tone={EVENT_TYPES[e.type].tone}>{EVENT_TYPES[e.type].label}</Badge>
                      <span className="flex-1 text-sm">{e.title}</span>
                      <span className="text-xs text-mute">{fmtDateTime(e.start)}</span>
                    </Link></li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <div className="space-y-6">
            <Card title="Details">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-mute">Client</dt><dd>{project.client?.name || "Internal"}</dd></div>
                <div className="flex justify-between"><dt className="text-mute">Start</dt><dd>{fmtDate(project.startDate)}</dd></div>
                <div className="flex justify-between"><dt className="text-mute">Deadline</dt><dd>{fmtDate(project.dueDate)}</dd></div>
                <div className="flex justify-between"><dt className="text-mute">Time logged</dt><dd>{fmtHours(totalMinutes)}</dd></div>
              </dl>
            </Card>
            <Card title="Team" bodyClass="">
              <ul className="divide-y divide-line">
                {members.map((u) => {
                  const mins = time.find((t) => t.userId === u.id)?._sum.minutes || 0;
                  return (
                    <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar user={u} size={30} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm">{u.name}</span>{u.title && <span className="block text-xs text-mute">{u.title}</span>}</span>
                      {can(me, "viewAllTime") && <span className="text-xs text-mute">{fmtHours(mins)}</span>}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
