import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Camera, MapPin, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditEvent } from "@/lib/permissions";
import { eventFormOptions } from "@/lib/event-form-data";
import { EQUIPMENT_CATEGORIES, EVENT_TYPES, dohaDay, fmtDate, fmtDateTime, fmtTime, toLocalInput } from "@/lib/format";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/client-ui";
import EventForm from "../EventForm";
import { deleteEvent } from "../actions";

export const metadata = { title: "Event" };

export default async function EventPage({ params, searchParams }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const me = await requireUser();
  const event = await db.event.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      attendees: { include: { user: { select: { id: true, name: true, color: true, title: true, phone: true } } } },
      bookings: { include: { equipment: true } },
    },
  });
  if (!event) notFound();
  const editable = canEditEvent(me, event);

  if (edit && editable) {
    const options = await eventFormOptions(me);
    const defaults = {
      start: toLocalInput(event.start), end: toLocalInput(event.end),
      startDay: dohaDay(event.start), endDay: dohaDay(event.end),
    };
    return (
      <>
        <PageHeader title={`Edit ${event.title}`} />
        <Card className="max-w-5xl">
          <EventForm
            event={{ ...event, attendeeIds: event.attendees.map((a) => a.userId), equipmentIds: event.bookings.map((b) => b.equipmentId) }}
            defaults={defaults}
            {...options}
          />
        </Card>
      </>
    );
  }

  const when = event.allDay
    ? dohaDay(event.start) === dohaDay(event.end) ? fmtDate(event.start) : `${fmtDate(event.start)} – ${fmtDate(event.end)}`
    : dohaDay(event.start) === dohaDay(event.end) ? `${fmtDate(event.start)}, ${fmtTime(event.start)} – ${fmtTime(event.end)}` : `${fmtDateTime(event.start)} – ${fmtDateTime(event.end)}`;

  return (
    <>
      <Link href={`/calendar?m=${dohaDay(event.start).slice(0, 7)}`} className="text-sm text-mute hover:text-gold">← Calendar</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone={EVENT_TYPES[event.type].tone}>{EVENT_TYPES[event.type].label}</Badge>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{event.title}</h1>
          <p className="mt-1 text-sm text-mute">Added by {event.createdBy.name}</p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <Link href={`/calendar/${event.id}?edit=1`} className="btn btn-ghost btn-sm"><Pencil size={14} />Edit</Link>
            <form action={deleteEvent}><input type="hidden" name="id" value={event.id} /><ConfirmButton message="Delete this event and its equipment bookings?">Delete</ConfirmButton></form>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3"><CalendarDays size={18} className="mt-0.5 text-gold" />{when}</li>
              {event.location && (
                <li className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 text-gold" />
                  {/^https?:\/\//.test(event.location) ? <a href={event.location} target="_blank" rel="noreferrer" className="break-all text-gold hover:underline">{event.location}</a> : event.location}
                </li>
              )}
              {event.project && <li className="flex items-start gap-3"><span className="mt-0.5 text-gold">◆</span><Link href={`/projects/${event.project.id}`} className="hover:text-gold">{event.project.name}</Link></li>}
            </ul>
            {event.notes && <p className="mt-5 whitespace-pre-wrap border-t border-line pt-4 text-sm leading-relaxed text-mute">{event.notes}</p>}
          </Card>
          {event.bookings.length > 0 && (
            <Card title={<span className="flex items-center gap-2"><Camera size={16} className="text-gold" />Equipment booked</span>} bodyClass="">
              <ul className="divide-y divide-line">
                {event.bookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span>{b.equipment.name}</span><span className="text-xs text-mute">{EQUIPMENT_CATEGORIES[b.equipment.category]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <Card title={event.type === "SHOOT" ? "Crew" : "Attendees"} bodyClass="">
          <ul className="divide-y divide-line">
            {event.attendees.map(({ user: u }) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar user={u} size={30} />
                <span className="min-w-0 flex-1"><span className="block text-sm">{u.name}</span>{u.title && <span className="block text-xs text-mute">{u.title}</span>}</span>
                {u.phone && <a href={`tel:${u.phone}`} className="text-xs text-mute hover:text-gold">{u.phone}</a>}
              </li>
            ))}
            {!event.attendees.length && <li className="px-5 py-4 text-sm text-mute">Nobody added.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
