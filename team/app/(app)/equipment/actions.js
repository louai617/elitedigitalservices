"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireCan, str } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { parseLocalDateTime } from "@/lib/dates";
import { fmtDateTime } from "@/lib/format";

const CATS = ["CAMERA", "LENS", "LIGHTING", "AUDIO", "DRONE", "GRIP", "COMPUTER", "OTHER"];

export async function saveEquipment(fd) {
  await requireCan("manageEquipment");
  const data = {
    name: str(fd, "name"),
    category: CATS.includes(str(fd, "category")) ? str(fd, "category") : "OTHER",
    serial: str(fd, "serial"),
    notes: str(fd, "notes"),
  };
  if (!data.name) throw new Error("Name is required.");
  const id = str(fd, "id");
  if (id) await db.equipment.update({ where: { id }, data });
  else await db.equipment.create({ data });
  revalidatePath("/equipment");
}

export async function toggleEquipment(fd) {
  await requireCan("manageEquipment");
  await db.equipment.update({ where: { id: String(fd.get("id")) }, data: { active: fd.get("active") === "true" } });
  revalidatePath("/equipment");
}

/** A booking without an event, e.g. taking a camera home for a weekend job. */
export async function bookEquipment(_prev, fd) {
  const me = await requireUser();
  const equipmentId = str(fd, "equipmentId");
  const start = parseLocalDateTime(str(fd, "start"));
  const end = parseLocalDateTime(str(fd, "end"));
  if (!equipmentId || !start || !end) return { error: "Pick the item and the times." };
  if (end <= start) return { error: "The end must be after the start." };
  const clash = await db.equipmentBooking.findFirst({
    where: { equipmentId, start: { lt: end }, end: { gt: start } },
    include: { user: { select: { name: true } }, event: { select: { title: true } } },
  });
  if (clash) return { error: `Already booked by ${clash.user.name}${clash.event ? ` for “${clash.event.title}”` : ""}, ${fmtDateTime(clash.start)} – ${fmtDateTime(clash.end)}.` };
  await db.equipmentBooking.create({ data: { equipmentId, userId: me.id, start, end, note: str(fd, "note") } });
  revalidatePath("/equipment");
  return { ok: "Booked." };
}

export async function cancelBooking(fd) {
  const me = await requireUser();
  const b = await db.equipmentBooking.findUnique({ where: { id: String(fd.get("id")) } });
  if (!b) return;
  if (b.eventId) throw new Error("This booking belongs to an event — edit the event instead.");
  if (b.userId !== me.id && !can(me, "manageEquipment")) throw new Error("Not allowed.");
  await db.equipmentBooking.delete({ where: { id: b.id } });
  revalidatePath("/equipment");
}
