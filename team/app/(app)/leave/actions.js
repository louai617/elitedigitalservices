"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireCan, str } from "@/lib/guard";
import { parseDay } from "@/lib/dates";

const TYPES = ["ANNUAL", "SICK", "UNPAID", "OTHER"];

export async function requestLeave(fd) {
  const me = await requireUser();
  const start = parseDay(str(fd, "start"));
  const end = parseDay(str(fd, "end")) || start;
  if (!start || end < start) throw new Error("Check the dates.");
  await db.leaveRequest.create({
    data: { userId: me.id, type: TYPES.includes(str(fd, "type")) ? str(fd, "type") : "ANNUAL", start, end, reason: str(fd, "reason") },
  });
  revalidatePath("/leave");
  revalidatePath("/calendar");
}

export async function cancelLeave(fd) {
  const me = await requireUser();
  const r = await db.leaveRequest.findUnique({ where: { id: String(fd.get("id")) } });
  if (!r || r.userId !== me.id || r.status !== "PENDING") throw new Error("Only your own pending requests can be cancelled.");
  await db.leaveRequest.delete({ where: { id: r.id } });
  revalidatePath("/leave");
  revalidatePath("/calendar");
}

/** Bound per button: reviewLeave.bind(null, "APPROVED"). */
export async function reviewLeave(decision, fd) {
  const me = await requireCan("approveLeave");
  const status = decision === "APPROVED" ? "APPROVED" : "REJECTED";
  const r = await db.leaveRequest.findUnique({ where: { id: String(fd.get("id")) } });
  if (!r) return;
  if (r.userId === me.id) throw new Error("Someone else has to approve your own leave.");
  await db.leaveRequest.update({ where: { id: r.id }, data: { status, reviewedById: me.id, reviewedAt: new Date() } });
  revalidatePath("/leave");
  revalidatePath("/calendar");
  revalidatePath("/", "layout");
}
