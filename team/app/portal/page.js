import Link from "next/link";
import { ArrowRight, CalendarClock, FolderKanban } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectScope } from "@/lib/permissions";
import { SERVICE_LABELS, fmtDate } from "@/lib/format";
import { Badge, Empty } from "@/components/ui";
import ProjectStepper from "@/components/ProjectStepper";

export const metadata = { title: "Your projects" };

export default async function PortalHome() {
  const me = await requireClient();
  const projects = await db.project.findMany({
    where: { ...projectScope(me), status: { not: "LEAD" } },
    orderBy: [{ status: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }],
    include: {
      tasks: { select: { status: true } },
      _count: { select: { files: { where: { sharedWithClient: true, clientStatus: "PENDING" } } } },
    },
  });
  const active = projects.filter((p) => p.status !== "DELIVERED");
  const delivered = projects.filter((p) => p.status === "DELIVERED");

  const card = (p) => {
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    const pct = p.status === "DELIVERED" ? 100 : p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
    return (
      <Link key={p.id} href={`/portal/projects/${p.id}`} className="card group block p-6 transition hover:border-gold/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold">{SERVICE_LABELS[p.service]}</p>
            <h2 className="mt-1 text-xl font-semibold group-hover:text-gold">{p.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {p._count.files > 0 && <Badge tone="gold">{p._count.files} awaiting your approval</Badge>}
            {p.status === "ON_HOLD" && <Badge tone="red">On hold</Badge>}
          </div>
        </div>
        <div className="mt-6"><ProjectStepper status={p.status} /></div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="min-w-48 flex-1">
            <div className="mb-1.5 flex justify-between text-xs text-mute"><span>Progress</span><span className="font-semibold text-bone">{pct}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-light" style={{ width: `${pct}%` }} /></div>
          </div>
          {p.dueDate && p.status !== "DELIVERED" && <span className="inline-flex items-center gap-1.5 text-sm text-mute"><CalendarClock size={15} />Due {fmtDate(p.dueDate)}</span>}
          <span className="inline-flex items-center gap-1 text-sm text-gold">Open <ArrowRight size={15} className="transition group-hover:translate-x-0.5" /></span>
        </div>
      </Link>
    );
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-mute">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{me.name.split(" ")[0]}, here's where your projects stand</h1>
      </div>
      {projects.length === 0 ? (
        <div className="card"><Empty icon={FolderKanban} title="No projects yet">Your projects with Elite Media Solutions will appear here.</Empty></div>
      ) : (
        <div className="space-y-5">
          {active.map(card)}
          {delivered.length > 0 && (
            <>
              <h2 className="pt-6 text-sm font-semibold uppercase tracking-wider text-mute">Delivered</h2>
              {delivered.map(card)}
            </>
          )}
        </div>
      )}
    </>
  );
}
