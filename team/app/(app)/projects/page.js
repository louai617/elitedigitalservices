import Link from "next/link";
import { CalendarClock, FolderKanban, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, projectScope } from "@/lib/permissions";
import { PROJECT_STATUS, SERVICE_LABELS, fmtShort } from "@/lib/format";
import { Avatar, Empty, PageHeader, StatusBadge } from "@/components/ui";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }) {
  const me = await requireUser();
  const { status, service } = await searchParams;
  const where = {
    ...projectScope(me),
    ...(status ? { status } : { status: { not: "DELIVERED" } }),
    ...(service && { service }),
  };
  const projects = await db.project.findMany({
    where,
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
    include: {
      client: { select: { name: true } },
      members: { include: { user: { select: { id: true, name: true, color: true } } } },
      tasks: { select: { status: true } },
      _count: { select: { files: { where: { status: "IN_REVIEW" } } } },
    },
  });

  const chip = (params, label, active) => {
    const q = new URLSearchParams(Object.entries({ status, service, ...params }).filter(([, v]) => v));
    return (
      <Link key={label} href={`/projects${q.size ? `?${q}` : ""}`}
        className={`rounded-full border px-3 py-1 text-xs transition ${active ? "border-gold bg-gold/10 text-gold" : "border-line text-mute hover:text-bone"}`}>
        {label}
      </Link>
    );
  };

  return (
    <>
      <PageHeader title="Projects" subtitle={status === "DELIVERED" ? "Delivered projects" : "Active projects"}>
        {can(me, "createProject") && <Link href="/projects/new" className="btn btn-primary"><Plus size={16} />New project</Link>}
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        {chip({ status: undefined }, "Active", !status)}
        {Object.entries(PROJECT_STATUS).map(([k, v]) => chip({ status: k }, v.label, status === k))}
        <span className="mx-1 w-px bg-line" />
        {chip({ service: undefined }, "All services", !service)}
        {Object.entries(SERVICE_LABELS).map(([k, v]) => chip({ service: k }, v, service === k))}
      </div>

      {projects.length === 0 ? (
        <div className="card"><Empty icon={FolderKanban} title="No projects here">{can(me, "createProject") ? "Create one with “New project”." : "You'll see projects once you're added to a team."}</Empty></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const done = p.tasks.filter((t) => t.status === "DONE").length;
            const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
            const overdue = p.dueDate && p.dueDate < new Date() && p.status !== "DELIVERED";
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-gold/40">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs uppercase tracking-wider text-gold">{SERVICE_LABELS[p.service]}</span>
                  <StatusBadge map={PROJECT_STATUS} value={p.status} />
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-snug group-hover:text-gold">{p.name}</h2>
                <p className="text-sm text-mute">{p.client?.name || "Internal"}</p>
                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-xs text-mute"><span>{done}/{p.tasks.length} tasks</span><span>{pct}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-light" style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">{p.members.slice(0, 5).map((m) => <Avatar key={m.user.id} user={m.user} size={28} />)}</div>
                  <div className="flex items-center gap-3 text-xs">
                    {p._count.files > 0 && <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-violet-300">{p._count.files} to review</span>}
                    {p.dueDate && <span className={`inline-flex items-center gap-1 ${overdue ? "text-red-300" : "text-mute"}`}><CalendarClock size={13} />{fmtShort(p.dueDate)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
