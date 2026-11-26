import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, projectScope } from "@/lib/permissions";
import { dohaDay, fmtHours } from "@/lib/format";
import { Avatar, Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/client-ui";
import TimeForm from "./TimeForm";
import { deleteTime } from "./actions";

export const metadata = { title: "Time" };

const addDays = (day, n) => new Date(new Date(`${day}T12:00:00Z`).getTime() + n * 864e5).toISOString().slice(0, 10);
const dayDate = (d) => new Date(`${d}T00:00:00Z`);
const label = (d, opts) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

export default async function TimePage({ searchParams }) {
  const me = await requireUser();
  const sp = await searchParams;
  const today = dohaDay(new Date());
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(sp.w || "") ? sp.w : today;
  const weekStart = addDays(anchor, -new Date(`${anchor}T12:00:00Z`).getUTCDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const month = /^\d{4}-\d{2}$/.test(sp.month || "") ? sp.month : today.slice(0, 7);
  const reports = can(me, "viewAllTime");

  const [projects, tasks, entries, report] = await Promise.all([
    db.project.findMany({ where: { ...projectScope(me), status: { not: "DELIVERED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.task.findMany({ where: { project: projectScope(me), status: { not: "DONE" } }, orderBy: { title: "asc" }, select: { id: true, title: true, projectId: true } }),
    db.timeEntry.findMany({
      where: { userId: me.id, date: { gte: dayDate(weekStart), lte: dayDate(weekDays[6]) } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: { project: { select: { name: true } }, task: { select: { title: true } } },
    }),
    reports
      ? db.timeEntry.groupBy({
          by: ["userId", "projectId"],
          where: { date: { gte: dayDate(`${month}-01`), lt: dayDate(`${new Date(Date.UTC(+month.slice(0, 4), +month.slice(5), 1)).toISOString().slice(0, 7)}-01`) } },
          _sum: { minutes: true },
        })
      : [],
  ]);

  const weekTotal = entries.reduce((s, e) => s + e.minutes, 0);
  let people = [], projNames = {};
  if (reports && report.length) {
    const [users, projs] = await Promise.all([
      db.user.findMany({ where: { id: { in: [...new Set(report.map((r) => r.userId))] } }, select: { id: true, name: true, color: true } }),
      db.project.findMany({ where: { id: { in: [...new Set(report.map((r) => r.projectId))] } }, select: { id: true, name: true } }),
    ]);
    projNames = Object.fromEntries(projs.map((p) => [p.id, p.name]));
    people = users.map((u) => {
      const rows = report.filter((r) => r.userId === u.id).map((r) => ({ project: projNames[r.projectId], minutes: r._sum.minutes || 0 })).sort((a, b) => b.minutes - a.minutes);
      return { ...u, rows, total: rows.reduce((s, r) => s + r.minutes, 0) };
    }).sort((a, b) => b.total - a.total);
  }
  const monthName = label(`${month}-01`, { month: "long", year: "numeric" });
  const prevMonth = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5) - 2, 1)).toISOString().slice(0, 7);
  const nextMonth = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5), 1)).toISOString().slice(0, 7);

  return (
    <>
      <PageHeader title="Time tracking" subtitle="Log hours against projects and tasks" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card
          title={`Week of ${label(weekStart, { day: "numeric", month: "short" })} · ${fmtHours(weekTotal)}`}
          action={
            <div className="flex gap-1">
              <Link href={`/time?w=${addDays(weekStart, -7)}`} className="btn btn-ghost btn-sm" aria-label="Previous week"><ChevronLeft size={14} /></Link>
              <Link href={`/time?w=${addDays(weekStart, 7)}`} className="btn btn-ghost btn-sm" aria-label="Next week"><ChevronRight size={14} /></Link>
            </div>
          }
          bodyClass=""
        >
          <ul className="divide-y divide-line">
            {weekDays.map((d) => {
              const list = entries.filter((e) => e.date.toISOString().slice(0, 10) === d);
              const total = list.reduce((s, e) => s + e.minutes, 0);
              return (
                <li key={d} className="px-5 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className={d === today ? "font-semibold text-gold" : "text-mute"}>{label(d, { weekday: "long", day: "numeric", month: "short" })}</span>
                    <span className={total ? "font-semibold" : "text-mute/50"}>{fmtHours(total)}</span>
                  </div>
                  {list.map((e) => (
                    <div key={e.id} className="mt-2 flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2 text-sm">
                      <span className="w-14 shrink-0 font-medium">{fmtHours(e.minutes)}</span>
                      <span className="min-w-0 flex-1 truncate">{e.project.name}{e.task && <span className="text-mute"> · {e.task.title}</span>}{e.note && <span className="text-mute"> — {e.note}</span>}</span>
                      <form action={deleteTime}><input type="hidden" name="id" value={e.id} /><ConfirmButton message="Delete this entry?" className="text-xs text-mute hover:text-red-300">✕</ConfirmButton></form>
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Log time" className="h-fit">
          <TimeForm projects={projects} tasks={tasks} defaults={{ date: today, projectId: sp.project, taskId: sp.task }} />
        </Card>
      </div>

      {reports && (
        <Card
          className="mt-6"
          title={`Team report · ${monthName}`}
          action={
            <div className="flex items-center gap-1">
              <Link href={`/time?month=${prevMonth}`} className="btn btn-ghost btn-sm" aria-label="Previous month"><ChevronLeft size={14} /></Link>
              <Link href={`/time?month=${nextMonth}`} className="btn btn-ghost btn-sm" aria-label="Next month"><ChevronRight size={14} /></Link>
              <a href={`/api/time-export?month=${month}`} className="btn btn-ghost btn-sm"><Download size={14} />CSV</a>
            </div>
          }
          bodyClass=""
        >
          {people.length === 0 ? <p className="px-5 py-6 text-sm text-mute">No time logged this month.</p> : (
            <ul className="divide-y divide-line">
              {people.map((p) => (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex items-center gap-3"><Avatar user={p} size={28} /><span className="flex-1 font-medium">{p.name}</span><span className="font-semibold">{fmtHours(p.total)}</span></div>
                  <div className="mt-2 space-y-1 pl-10">
                    {p.rows.map((r) => (
                      <div key={r.project} className="flex items-center gap-3 text-sm text-mute">
                        <span className="min-w-0 flex-1 truncate">{r.project}</span>
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5"><span className="block h-full bg-gold" style={{ width: `${(r.minutes / p.total) * 100}%` }} /></span>
                        <span className="w-16 text-right">{fmtHours(r.minutes)}</span>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
