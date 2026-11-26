"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { str } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { canSeeProject } from "@/lib/access";
import { parseDay } from "@/lib/dates";

/** Accepts "1.5", "1:30", "90m" or "2h". */
function parseDuration(s) {
  if (!s) return 0;
  s = s.trim().toLowerCase();
  let m;
  if ((m = /^(\d+):(\d{1,2})$/.exec(s))) return Number(m[1]) * 60 + Number(m[2]);
  if ((m = /^(\d+)\s*m(in)?$/.exec(s))) return Number(m[1]);
  if ((m = /^(\d+(?:\.\d+)?)\s*h?$/.exec(s))) return Math.round(Number(m[1]) * 60);
  return 0;
}

export async function logTime(_prev, fd) {
  const me = await requireUser();
  const projectId = str(fd, "projectId");
  const minutes = parseDuration(str(fd, "duration"));
  const date = parseDay(str(fd, "date"));
  if (!projectId || !date) return { error: "Choose a project and a date." };
  if (minutes <= 0 || minutes > 24 * 60) return { error: "Enter the time spent, e.g. 1.5 or 1:30." };
  if (!(await canSeeProject(me, projectId))) return { error: "Unknown project." };
  let taskId = str(fd, "taskId");
  if (taskId) {
    const task = await db.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (task?.projectId !== projectId) taskId = null;
  }
  await db.timeEntry.create({ data: { userId: me.id, projectId, taskId, date, minutes, note: str(fd, "note") } });
  revalidatePath("/time");
  return { ok: `Logged ${Math.floor(minutes / 60)}h ${minutes % 60}m.` };
}

export async function deleteTime(fd) {
  const me = await requireUser();
  const entry = await db.timeEntry.findUnique({ where: { id: String(fd.get("id")) } });
  if (!entry) return;
  if (entry.userId !== me.id && !can(me, "viewAllTime")) throw new Error("Not allowed.");
  await db.timeEntry.delete({ where: { id: entry.id } });
  revalidatePath("/time");
}
