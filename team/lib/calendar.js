import "server-only";
import { db } from "./db";
import { can, projectScope } from "./permissions";
import { LEAVE_TYPES } from "./format";

const iso = (d) => d.toISOString().slice(0, 10); // for @db.Date values (UTC midnight)

/**
 * Everything on the shared calendar between two instants, as plain items:
 * events and shoots, approved leave (pending too for approvers and the
 * requester), task due dates and project deadlines the user can see.
 *
 * Each item carries either {start, end} instants or {day, endDay} calendar
 * dates (YYYY-MM-DD) for date-only things.
 */
export async function calendarItems(user, from, to, { mine = false } = {}) {
  const fromDay = iso(from), toDay = iso(to);
  const [events, leave, tasks, projects] = await Promise.all([
    db.event.findMany({
      where: {
        start: { lt: to }, end: { gt: from },
        ...(mine && { OR: [{ createdById: user.id }, { attendees: { some: { userId: user.id } } }] }),
      },
      orderBy: { start: "asc" },
      include: { attendees: { include: { user: { select: { color: true } } } } },
    }),
    db.leaveRequest.findMany({
      where: {
        start: { lte: new Date(`${toDay}T00:00:00Z`) }, end: { gte: new Date(`${fromDay}T00:00:00Z`) },
        status: can(user, "approveLeave") ? { in: ["APPROVED", "PENDING"] } : undefined,
        OR: can(user, "approveLeave") ? undefined : [{ status: "APPROVED" }, { userId: user.id, status: "PENDING" }],
        ...(mine && { userId: user.id }),
      },
      include: { user: { select: { name: true, color: true } } },
    }),
    db.task.findMany({
      where: {
        dueDate: { gte: new Date(`${fromDay}T00:00:00Z`), lte: new Date(`${toDay}T00:00:00Z`) },
        status: { not: "DONE" },
        project: projectScope(user),
        ...(mine || !can(user, "manageAnyTask") ? { assigneeId: user.id } : {}),
      },
      select: { id: true, title: true, dueDate: true, assignee: { select: { color: true } } },
    }),
    db.project.findMany({
      where: { ...projectScope(user), dueDate: { gte: new Date(`${fromDay}T00:00:00Z`), lte: new Date(`${toDay}T00:00:00Z`) }, status: { not: "DELIVERED" } },
      select: { id: true, name: true, dueDate: true },
    }),
  ]);

  return [
    ...events.map((e) => ({
      key: `e-${e.id}`, kind: e.type === "SHOOT" ? "shoot" : "event", type: e.type,
      title: e.title, start: e.start, end: e.end, allDay: e.allDay, href: `/calendar/${e.id}`,
      color: e.type === "SHOOT" ? "#EAB877" : e.type === "DEADLINE" ? "#F87171" : e.attendees[0]?.user.color || "#60A5FA",
    })),
    ...leave.map((l) => ({
      key: `l-${l.id}`, kind: "leave", title: `${l.user.name} — ${LEAVE_TYPES[l.type]}`,
      day: iso(l.start), endDay: iso(l.end), href: "/leave", color: l.user.color, dashed: l.status === "PENDING",
    })),
    ...tasks.map((t) => ({
      key: `t-${t.id}`, kind: "task", title: `Due: ${t.title}`, day: iso(t.dueDate), endDay: iso(t.dueDate),
      href: `/tasks/${t.id}`, color: t.assignee?.color || "#9A9AA3",
    })),
    ...projects.map((p) => ({
      key: `p-${p.id}`, kind: "deadline", title: `Deadline: ${p.name}`, day: iso(p.dueDate), endDay: iso(p.dueDate),
      href: `/projects/${p.id}`, color: "#F87171",
    })),
  ];
}
