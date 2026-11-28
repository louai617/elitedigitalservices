import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CalendarDays, Check, Circle, Download, FileText, MapPin, MessageSquare } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { canSeeProject } from "@/lib/access";
import { CLIENT_DECISION, EVENT_TYPES, SERVICE_LABELS, fmtBytes, fmtDate, fmtDateTime, fmtShort, fmtTime, dohaDay } from "@/lib/format";
import { Badge, Card, StatusBadge } from "@/components/ui";
import ProjectStepper from "@/components/ProjectStepper";
import MessageThread from "@/components/MessageThread";
import { SubmitButton } from "@/components/client-ui";
import { decideOnFile, sendClientMessage } from "../../actions";

export const metadata = { title: "Project" };
const author = { select: { id: true, name: true, color: true, role: true } };

function Preview({ file }) {
  const src = `/api/files/${file.id}`;
  if (file.mime.startsWith("image/")) return <img src={src} alt={file.name} loading="lazy" className="h-full w-full object-cover" />;
  if (file.mime.startsWith("video/")) return <video src={src} controls preload="metadata" playsInline className="h-full w-full bg-black object-contain" />;
  return <a href={src} target="_blank" className="flex h-full w-full items-center justify-center text-mute"><FileText size={34} /></a>;
}

export default async function PortalProject({ params }) {
  const { id } = await params;
  const me = await requireClient();
  if (!(await canSeeProject(me, id))) notFound();

  const [project, milestones, counts, events, files, messages] = await Promise.all([
    db.project.findUnique({ where: { id } }),
    db.task.findMany({ where: { projectId: id, clientVisible: true }, orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }], select: { id: true, title: true, status: true, dueDate: true } }),
    db.task.groupBy({ by: ["status"], where: { projectId: id }, _count: true }),
    db.event.findMany({ where: { projectId: id, end: { gte: new Date() } }, orderBy: { start: "asc" }, take: 6, select: { id: true, title: true, type: true, start: true, end: true, allDay: true, location: true } }),
    db.projectFile.findMany({ where: { projectId: id, sharedWithClient: true }, orderBy: { sharedAt: "desc" }, select: { id: true, name: true, mime: true, size: true, sharedAt: true, clientStatus: true } }),
    db.projectMessage.findMany({ where: { projectId: id }, orderBy: { createdAt: "asc" }, include: { author } }),
  ]);
  if (!project || project.status === "LEAD") notFound();

  const total = counts.reduce((s, c) => s + c._count, 0);
  const done = counts.find((c) => c.status === "DONE")?._count || 0;
  const pct = project.status === "DELIVERED" ? 100 : total ? Math.round((done / total) * 100) : 0;
  const waiting = files.filter((f) => f.clientStatus === "PENDING").length;

  return (
    <>
      <Link href="/portal" className="text-sm text-mute hover:text-gold">← All projects</Link>
      <div className="mt-3 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold">{SERVICE_LABELS[project.service]}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-4xl">{project.name}</h1>
        </div>
        {project.status === "ON_HOLD" && <Badge tone="red">On hold</Badge>}
      </div>

      {/* Progress */}
      <section className="card mb-6 p-6">
        <ProjectStepper status={project.status} />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-baseline justify-between"><span className="text-sm text-mute">Overall progress</span><span className="text-3xl font-bold">{pct}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-light transition-all" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-xs text-mute">{done} of {total} production steps complete</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-mute"><CalendarClock size={16} className="text-gold" />Deadline <span className="ml-auto text-bone">{fmtDate(project.dueDate)}</span></p>
            <p className="flex items-center gap-2 text-mute"><CalendarDays size={16} className="text-gold" />Started <span className="ml-auto text-bone">{fmtDate(project.startDate)}</span></p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Deliverables */}
          <Card title={`Deliverables${waiting ? ` · ${waiting} awaiting your approval` : ""}`} bodyClass={files.length ? "p-4" : ""}>
            {files.length === 0 ? <p className="px-5 py-6 text-sm text-mute">Drafts and final files will appear here for you to review.</p> : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {files.map((f) => (
                  <li key={f.id} className="overflow-hidden rounded-xl border border-line bg-panel-2">
                    <div className="aspect-video bg-ink"><Preview file={f} /></div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium" title={f.name}>{f.name}</p>
                        <StatusBadge map={{ ...CLIENT_DECISION, PENDING: { label: "Needs your review", tone: "gold" }, APPROVED: { label: "Approved", tone: "green" }, CHANGES_REQUESTED: { label: "Changes requested", tone: "red" } }} value={f.clientStatus || "PENDING"} />
                      </div>
                      <p className="mt-1 text-xs text-mute">{fmtBytes(f.size)} · shared {fmtShort(f.sharedAt)}</p>
                      <a href={`/api/files/${f.id}?download=1`} className="btn btn-ghost btn-sm mt-3"><Download size={13} />Download</a>
                      {f.clientStatus !== "APPROVED" && (
                        <form className="mt-3 space-y-2 border-t border-line pt-3">
                          <input type="hidden" name="id" value={f.id} />
                          <textarea name="note" rows={2} placeholder="Comments for the team (optional)" className="input text-sm" />
                          <div className="flex flex-wrap gap-2">
                            <button formAction={decideOnFile.bind(null, "APPROVED")} className="btn btn-sm bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"><Check size={14} />Approve</button>
                            <button formAction={decideOnFile.bind(null, "CHANGES_REQUESTED")} className="btn btn-sm bg-red-500/10 text-red-300 hover:bg-red-500/20">Request changes</button>
                          </div>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Messages */}
          <Card title={<span className="flex items-center gap-2"><MessageSquare size={16} className="text-gold" />Messages with the team</span>}>
            <MessageThread
              messages={messages}
              action={sendClientMessage}
              projectId={id}
              meId={me.id}
              placeholder="Ask a question or share feedback…"
              emptyText="Have a question about the project? Write to the team here."
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Milestones" bodyClass="">
            {milestones.length === 0 ? <p className="px-5 py-5 text-sm text-mute">The team will add milestones as the project takes shape.</p> : (
              <ol className="relative px-5 py-4">
                {milestones.map((m, i) => {
                  const isDone = m.status === "DONE";
                  const active = !isDone && m.status !== "TODO";
                  return (
                    <li key={m.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {i < milestones.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-px ${isDone ? "bg-gold" : "bg-line"}`} />}
                      <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isDone ? "bg-gold text-ink" : active ? "bg-gold/15 text-gold ring-2 ring-gold" : "bg-white/5 text-mute"}`}>
                        {isDone ? <Check size={13} strokeWidth={3} /> : <Circle size={7} className="fill-current" />}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm ${isDone ? "text-mute line-through decoration-gold/40" : ""}`}>{m.title}</p>
                        <p className="text-xs text-mute">{isDone ? "Done" : active ? "In progress" : "Upcoming"}{m.dueDate && ` · ${fmtShort(m.dueDate)}`}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card title="Coming up" bodyClass="">
            {events.length === 0 ? <p className="px-5 py-5 text-sm text-mute">No shoots or meetings scheduled.</p> : (
              <ul className="divide-y divide-line">
                {events.map((e) => (
                  <li key={e.id} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone={EVENT_TYPES[e.type].tone}>{EVENT_TYPES[e.type].label}</Badge>
                      <span className="truncate text-sm font-medium">{e.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-mute">{e.allDay ? fmtDate(e.start) : `${fmtDateTime(e.start)} – ${dohaDay(e.start) === dohaDay(e.end) ? fmtTime(e.end) : fmtDateTime(e.end)}`}</p>
                    {e.location && <p className="mt-0.5 flex items-center gap-1 text-xs text-mute"><MapPin size={12} />{e.location}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
