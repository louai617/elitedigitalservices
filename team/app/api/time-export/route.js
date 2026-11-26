import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

const csv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Month of time entries as CSV, for payroll and client billing. */
export async function GET(request) {
  const user = await getUser();
  if (!user || !can(user, "viewAllTime")) return new Response("Forbidden", { status: 403 });
  const month = new URL(request.url).searchParams.get("month");
  if (!/^\d{4}-\d{2}$/.test(month || "")) return new Response("Bad month", { status: 400 });
  const from = new Date(`${month}-01T00:00:00Z`);
  const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
  const entries = await db.timeEntry.findMany({
    where: { date: { gte: from, lt: to } },
    orderBy: [{ date: "asc" }],
    include: { user: { select: { name: true } }, project: { select: { name: true, client: { select: { name: true } } } }, task: { select: { title: true } } },
  });
  const lines = [
    ["Date", "Person", "Client", "Project", "Task", "Hours", "Note"].map(csv).join(","),
    ...entries.map((e) =>
      [e.date.toISOString().slice(0, 10), e.user.name, e.project.client?.name, e.project.name, e.task?.title, (e.minutes / 60).toFixed(2), e.note].map(csv).join(",")
    ),
  ];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ems-time-${month}.csv"` },
  });
}
