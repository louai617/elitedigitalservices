import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, ListChecks, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, projectScope } from "@/lib/permissions";
import { calendarItems } from "@/lib/calendar";
import { dohaDayStart } from "@/lib/dates";
import { PRIORITY, PROJECT_STATUS, dohaDay, fmtHours, fmtShort, fmtTime } from "@/lib/format";
import { Avatar, Badge, Card, Empty, Stat, StatusBadge } from "@/components/ui";

export const metadata = { title: "Dashboard" };

const addDays = (day, n) => new Date(new Date(`${day}T12:00:00Z`).getTime() + n * 864e5).toISOString().slice(0, 10);

export default async function Dashboard() {
  const me = await requireUser();
  const today = dohaDay(new Date());
  const todayDate = new Date(`${today}T00:00:00Z`);
  const weekStart = addDays(today, -new Date(`${today}T12:00:00Z`).getUTCDay());
  const reviewer = can(me, "reviewFiles");
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Qatar" }));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [myTasks, overdue, weekMinutes, agenda, toReview, activeProjects] = await Promise.all([
    db.task.findMany({
      where: { assigneeId: me.id, status: { not: "DONE" } },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
      take: 8,
      include: { project: { select: { name: true } } },
    }),
    db.task.count({ where: { assigneeId: me.id, status: { not: "DONE" }, dueDate: { lt: todayDate } } }),
    db.timeEntry.aggregate({ where: { userId: me.id, date: { gte: new Date(`${weekStart}T00:00:00Z`) } }, _sum: { minutes: true } }),
    calendarItems(me, dohaDayStart(today), dohaDayStart(addDays(today, 7)), { mine: true }),
    reviewer
      ? db.projectFile.findMany({ where: { status: "IN_REVIEW" }, orderBy: { createdAt: "asc" }, take: 6, include: { project: { select: { id: true, name: true } }, uploadedBy: { select: { name: true, color: true } } } })
      : [],
    db.project.findMany({
      where: { ...projectScope(me), status: { in: ["PLANNING", "IN_PROGRESS", "REVIEW"] } },
      orderBy: { dueDate: { sort: "asc", nulls: "last" } },
      take: 5,
      include: { tasks: { select: { status: true } }, client: { select: { name: true } } },
    }),
  ]);

  const todayItems = agenda.filter((it) => (it.day ? it.day <= today && today <= it.endDay : dohaDay(it.start) <= today && dohaDay(it.end) >= today));
  const sortKey = (it) => (it.day ? `${it.day}T00` : it.start.toISOString());
  agenda.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Qatar" })}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{greeting}, {me.name.split(" ")[0]}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/calendar/new" className="btn btn-ghost"><Plus size={16} />Event</Link>
          {can(me, "createProject") && <Link href="/projects/new" className="btn btn-primary"><Plus size={16} />Project</Link>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={ListChecks} label="Open tasks" value={myTasks.length} href="/tasks" />
        <Stat icon={AlertTriangle} label="Overdue" value={overdue} href="/tasks" />
        <Stat icon={CalendarDays} label="Today" value={todayItems.length} href="/calendar" />
        <Stat icon={Clock} label="This week" value={fmtHours(weekMinutes._sum.minutes || 0)} href="/time" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="My tasks" action={<Link href="/tasks" className="text-xs text-gold hover:underline">Board →</Link>} bodyClass="">
            {myTasks.length === 0 ? <Empty icon={CheckCircle2} title="All clear">No open tasks assigned to you.</Empty> : (
              <ul className="divide-y divide-line">
                {myTasks.map((t) => {
                  const late = t.dueDate && t.dueDate < todayDate;
                  return (
                    <li key={t.id}>
                      <Link href={`/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]">
                        <Badge tone={PRIORITY[t.priority].tone}>{PRIORITY[t.priority].label}</Badge>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm">{t.title}</span><span className="block truncate text-xs text-mute">{t.project.name}</span></span>
                        {t.dueDate && <span className={`text-xs ${late ? "text-red-300" : "text-mute"}`}>{late ? "Overdue · " : ""}{fmtShort(t.dueDate)}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Active projects" action={<Link href="/projects" className="text-xs text-gold hover:underline">All →</Link>} bodyClass="">
            {activeProjects.length === 0 ? <p className="px-5 py-5 text-sm text-mute">No active projects.</p> : (
              <ul className="divide-y divide-line">
                {activeProjects.map((p) => {
                  const pct = p.tasks.length ? Math.round((p.tasks.filter((t) => t.status === "DONE").length / p.tasks.length) * 100) : 0;
                  return (
                    <li key={p.id}>
                      <Link href={`/projects/${p.id}`} className="flex items-center gap-4 px-5 py-3 transition hover:bg-white/[0.02]">
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="text-xs text-mute">{p.client?.name || "Internal"}{p.dueDate && ` · due ${fmtShort(p.dueDate)}`}</span></span>
                        <span className="hidden w-28 sm:block"><span className="block h-1.5 overflow-hidden rounded-full bg-white/5"><span className="block h-full bg-gradient-to-r from-gold-deep to-gold-light" style={{ width: `${pct}%` }} /></span></span>
                        <StatusBadge map={PROJECT_STATUS} value={p.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="My next 7 days" action={<Link href="/calendar" className="text-xs text-gold hover:underline">Calendar →</Link>} bodyClass="">
            {agenda.length === 0 ? <Empty icon={CalendarDays} title="Nothing scheduled" /> : (
              <ul className="divide-y divide-line">
                {agenda.slice(0, 10).map((it) => {
                  const day = it.day || dohaDay(it.start);
                  return (
                    <li key={it.key}>
                      <Link href={it.href} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]">
                        <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: it.color }} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm">{it.title}</span>
                          <span className="text-xs text-mute">{day === today ? "Today" : new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}{!it.day && !it.allDay && ` · ${fmtTime(it.start)}`}</span></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {reviewer && (
            <Card title={`Waiting for your review · ${toReview.length}`} bodyClass="">
              {toReview.length === 0 ? <p className="px-5 py-5 text-sm text-mute">Nothing to review.</p> : (
                <ul className="divide-y divide-line">
                  {toReview.map((f) => (
                    <li key={f.id}>
                      <Link href={`/projects/${f.project.id}?tab=files`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]">
                        <Avatar user={f.uploadedBy} size={26} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm">{f.name}</span><span className="block truncate text-xs text-mute">{f.project.name}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
