import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { calendarItems } from "@/lib/calendar";
import { dohaDayStart } from "@/lib/dates";
import { dohaDay, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Calendar" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const addMonths = (ym, n) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const addDays = (day, n) => new Date(new Date(`${day}T12:00:00Z`).getTime() + n * 864e5).toISOString().slice(0, 10);

/** Does an item fall on this Doha calendar day? */
function onDay(item, day) {
  if (item.day) return item.day <= day && day <= item.endDay;
  const s = dohaDayStart(day), e = new Date(s.getTime() + 864e5);
  return item.start < e && item.end > s;
}

function Chip({ item, day }) {
  const time = !item.day && !item.allDay && dohaDay(item.start) === day ? fmtTime(item.start) : null;
  return (
    <Link
      href={item.href}
      title={item.title}
      className={`flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[11px] leading-5 transition hover:brightness-125 ${item.dashed ? "border border-dashed" : ""}`}
      style={{ background: `${item.color}22`, color: item.color, borderColor: item.dashed ? item.color : undefined }}
    >
      {time && <span className="shrink-0 font-semibold">{time}</span>}
      <span className="truncate">{item.kind === "shoot" ? "📷 " : ""}{item.title}</span>
    </Link>
  );
}

export default async function CalendarPage({ searchParams }) {
  const me = await requireUser();
  const sp = await searchParams;
  const today = dohaDay(new Date());
  const ym = /^\d{4}-\d{2}$/.test(sp.m || "") ? sp.m : today.slice(0, 7);
  const mine = sp.mine === "1";

  // Grid: Sunday before the 1st through Saturday after the last day.
  const first = `${ym}-01`;
  const lead = new Date(`${first}T12:00:00Z`).getUTCDay();
  const gridStart = addDays(first, -lead);
  const last = addDays(`${addMonths(ym, 1)}-01`, -1);
  const trail = 6 - new Date(`${last}T12:00:00Z`).getUTCDay();
  const gridEnd = addDays(last, trail);
  const days = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const items = await calendarItems(me, dohaDayStart(gridStart), new Date(dohaDayStart(gridEnd).getTime() + 864e5), { mine });
  const monthLabel = new Date(`${first}T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const q = (extra) => `/calendar?${new URLSearchParams({ m: ym, ...(mine && { mine: "1" }), ...extra })}`;
  const monthDays = days.filter((d) => d.startsWith(ym));

  return (
    <>
      <PageHeader title="Calendar" subtitle="Meetings, shoots, leave and deadlines — shared with the whole team">
        <Link href={mine ? `/calendar?m=${ym}` : `/calendar?m=${ym}&mine=1`} className={`rounded-full border px-3 py-1.5 text-xs ${mine ? "border-gold bg-gold/10 text-gold" : "border-line text-mute"}`}>
          {mine ? "Showing: mine" : "Showing: everyone"}
        </Link>
        <Link href={`/calendar/new?date=${ym === today.slice(0, 7) ? today : first}`} className="btn btn-primary"><Plus size={16} />New event</Link>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <Link href={q({ m: addMonths(ym, -1) })} className="btn btn-ghost btn-sm" aria-label="Previous month"><ChevronLeft size={16} /></Link>
        <Link href={q({ m: addMonths(ym, 1) })} className="btn btn-ghost btn-sm" aria-label="Next month"><ChevronRight size={16} /></Link>
        <h2 className="ml-2 text-lg font-semibold">{monthLabel}</h2>
        {ym !== today.slice(0, 7) && <Link href={q({ m: today.slice(0, 7) })} className="btn btn-ghost btn-sm ml-auto">Today</Link>}
      </div>

      {/* Month grid (tablet and up) */}
      <div className="card hidden overflow-hidden sm:block">
        <div className="grid grid-cols-7 border-b border-line text-center text-xs font-medium text-mute">
          {WEEKDAYS.map((w) => <div key={w} className="py-2.5">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dayItems = items.filter((it) => onDay(it, d));
            const inMonth = d.startsWith(ym);
            const isToday = d === today;
            return (
              <div key={d} className={`group relative min-h-28 border-line p-1.5 ${i % 7 ? "border-l" : ""} ${i >= 7 ? "border-t" : ""} ${inMonth ? "" : "bg-black/20"}`}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-gold font-bold text-ink" : inMonth ? "" : "text-mute/50"}`}>{Number(d.slice(8))}</span>
                  <Link href={`/calendar/new?date=${d}`} className="rounded p-0.5 text-mute opacity-0 transition hover:text-gold group-hover:opacity-100" aria-label={`Add event on ${d}`}><Plus size={14} /></Link>
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 4).map((it) => <Chip key={it.key} item={it} day={d} />)}
                  {dayItems.length > 4 && <p className="px-1.5 text-[11px] text-mute">+{dayItems.length - 4} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda list (phones) */}
      <div className="space-y-3 sm:hidden">
        {monthDays.map((d) => {
          const dayItems = items.filter((it) => onDay(it, d));
          if (!dayItems.length && d !== today) return null;
          return (
            <div key={d} className="card p-4">
              <p className={`mb-2 text-sm font-semibold ${d === today ? "text-gold" : ""}`}>
                {new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })}
                {d === today && " · Today"}
              </p>
              {dayItems.length ? <div className="space-y-1.5">{dayItems.map((it) => <Chip key={it.key} item={it} day={d} />)}</div> : <p className="text-sm text-mute">Nothing scheduled.</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-mute">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" />Shoots</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" />Deadlines</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-mute" />Leave awaiting approval</span>
        <span>Other colours: the person's calendar colour</span>
      </div>
    </>
  );
}
