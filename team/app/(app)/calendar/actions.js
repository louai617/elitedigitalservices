"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { str } from "@/lib/guard";
import { canEditEvent } from "@/lib/permissions";
import { canSeeProject } from "@/lib/access";
import { dohaDayStart, parseLocalDateTime } from "@/lib/dates";
import { fmtDateTime } from "@/lib/format";

const TYPES = ["MEETING", "SHOOT", "DEADLINE", "OTHER"];

function readEvent(fd) {
  const allDay = fd.get("allDay") === "on";
  let start, end;
  if (allDay) {
    const s = str(fd, "startDay"), e = str(fd, "endDay") || s;
    start = s && dohaDayStart(s);
    end = e && new Date(dohaDayStart(e).getTime() + 864e5 - 1);
  } else {
    start = parseLocalDateTime(str(fd, "start"));
    end = parseLocalDateTime(str(fd, "end"));
  }
  return {
    title: str(fd, "title"),
    type: TYPES.includes(str(fd, "type")) ? str(fd, "type") : "MEETING",
    allDay, start, end,
    location: str(fd, "location"),
    notes: str(fd, "notes"),
    projectId: str(fd, "projectId"),
  };
}

/** Equipment already booked in [start, end), ignoring this event's own bookings. */
async function conflicts(equipmentIds, start, end, eventId) {
  if (!equipmentIds.length) return [];
  return db.equipmentBooking.findMany({
    where: {
      equipmentId: { in: equipmentIds },
      start: { lt: end },
      end: { gt: start },
      ...(eventId && { NOT: { eventId } }),
    },
    include: { equipment: true, event: { select: { title: true } }, user: { select: { name: true } } },
  });
}

export async function saveEvent(_prev, fd) {
  const me = await requireUser();
  const id = str(fd, "id");
  const data = readEvent(fd);
  if (!data.title) return { error: "Give the event a title." };
  if (!data.start || !data.end || isNaN(data.start) || isNaN(data.end)) return { error: "Set when it starts and ends." };
  if (data.end <= data.start) return { error: "The end must be after the start." };
  if (data.projectId && !(await canSeeProject(me, data.projectId))) return { error: "Unknown project." };

  if (id) {
    const existing = await db.event.findUnique({ where: { id } });
    if (!existing || !canEditEvent(me, existing)) return { error: "You can't edit this event." };
  }

  const attendeeIds = [...new Set(fd.getAll("attendees").map(String))];
  const equipmentIds = [...new Set(fd.getAll("equipment").map(String))];
  const clash = await conflicts(equipmentIds, data.start, data.end, id);
  if (clash.length) {
    return {
      error:
        "Equipment already booked: " +
        clash.map((c) => `${c.equipment.name} (${c.event?.title || c.user.name}, ${fmtDateTime(c.start)})`).join("; "),
    };
  }

  const eventId = await db.$transaction(async (tx) => {
    const ev = id
      ? await tx.event.update({ where: { id }, data })
      : await tx.event.create({ data: { ...data, createdById: me.id } });
    await tx.eventAttendee.deleteMany({ where: { eventId: ev.id } });
    if (attendeeIds.length) await tx.eventAttendee.createMany({ data: attendeeIds.map((userId) => ({ eventId: ev.id, userId })) });
    // Bookings follow the event's times.
    await tx.equipmentBooking.deleteMany({ where: { eventId: ev.id } });
    if (equipmentIds.length) {
      await tx.equipmentBooking.createMany({
        data: equipmentIds.map((equipmentId) => ({ equipmentId, eventId: ev.id, userId: me.id, start: data.start, end: data.end })),
      });
    }
    return ev.id;
  });

  revalidatePath("/calendar");
  revalidatePath("/equipment");
  redirect(`/calendar/${eventId}`);
}

export async function deleteEvent(fd) {
  const me = await requireUser();
  const ev = await db.event.findUnique({ where: { id: String(fd.get("id")) } });
  if (!ev || !canEditEvent(me, ev)) throw new Error("You can't delete this event.");
  await db.event.delete({ where: { id: ev.id } });
  revalidatePath("/calendar");
  redirect(`/calendar?m=${ev.start.toISOString().slice(0, 7)}`);
}
