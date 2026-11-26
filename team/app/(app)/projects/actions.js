"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireCan, str } from "@/lib/guard";
import { can, canEditTask } from "@/lib/permissions";
import { canSeeProject } from "@/lib/access";
import { parseDay } from "@/lib/dates";
import { ensureFilesDir, filePath } from "@/lib/files";

const SERVICES = ["PROGRAMMING", "PHOTOGRAPHY", "VIDEOGRAPHY", "DESIGN", "BRANDING", "MARKETING", "OTHER"];
const PSTATUS = ["LEAD", "PLANNING", "IN_PROGRESS", "REVIEW", "DELIVERED", "ON_HOLD"];
const TSTATUS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const pick = (v, list, fallback) => (list.includes(v) ? v : fallback);

async function assertProject(user, projectId) {
  if (!(await canSeeProject(user, projectId))) throw new Error("Project not found.");
}

// ---------------------------------------------------------------- projects
function projectData(fd) {
  return {
    name: str(fd, "name"),
    clientId: str(fd, "clientId"),
    service: pick(str(fd, "service"), SERVICES, "OTHER"),
    status: pick(str(fd, "status"), PSTATUS, "PLANNING"),
    description: str(fd, "description"),
    startDate: parseDay(str(fd, "startDate")),
    dueDate: parseDay(str(fd, "dueDate")),
  };
}

export async function createProject(fd) {
  const me = await requireCan("createProject");
  const data = projectData(fd);
  if (!data.name) throw new Error("Project name is required.");
  const memberIds = [...new Set([...fd.getAll("members").map(String), me.id])];
  const project = await db.project.create({
    data: { ...data, createdById: me.id, members: { create: memberIds.map((userId) => ({ userId })) } },
  });
  redirect(`/projects/${project.id}`);
}

export async function updateProject(fd) {
  await requireCan("editProject");
  const id = String(fd.get("id"));
  const data = projectData(fd);
  if (!data.name) throw new Error("Project name is required.");
  const memberIds = [...new Set(fd.getAll("members").map(String))];
  await db.$transaction([
    db.project.update({ where: { id }, data }),
    db.projectMember.deleteMany({ where: { projectId: id, userId: { notIn: memberIds } } }),
    ...memberIds.map((userId) =>
      db.projectMember.upsert({
        where: { projectId_userId: { projectId: id, userId } },
        create: { projectId: id, userId },
        update: {},
      })
    ),
  ]);
  redirect(`/projects/${id}`);
}

export async function setProjectStatus(fd) {
  await requireCan("editProject");
  const id = String(fd.get("id"));
  await db.project.update({ where: { id }, data: { status: pick(str(fd, "status"), PSTATUS, "PLANNING") } });
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function deleteProject(fd) {
  await requireCan("deleteProject");
  const id = String(fd.get("id"));
  const files = await db.projectFile.findMany({ where: { projectId: id }, select: { storedName: true } });
  await db.project.delete({ where: { id } });
  await Promise.all(files.map((f) => unlink(filePath(f.storedName)).catch(() => {})));
  redirect("/projects");
}

// ------------------------------------------------------------------- tasks
export async function createTask(fd) {
  const me = await requireUser();
  const projectId = String(fd.get("projectId"));
  await assertProject(me, projectId);
  const title = str(fd, "title");
  if (!title) throw new Error("Task title is required.");
  // Staff can only create tasks for themselves; managers can assign anyone.
  let assigneeId = str(fd, "assigneeId");
  if (!can(me, "manageAnyTask")) assigneeId = assigneeId ? me.id : null;
  await db.task.create({
    data: {
      projectId, title,
      description: str(fd, "description"),
      status: pick(str(fd, "status"), TSTATUS, "TODO"),
      priority: pick(str(fd, "priority"), PRIORITIES, "MEDIUM"),
      assigneeId,
      dueDate: parseDay(str(fd, "dueDate")),
      createdById: me.id,
    },
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
}

/** Kanban drag-and-drop. Called from the client with plain arguments. */
export async function moveTask(taskId, status) {
  const me = await requireUser();
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found.");
  await assertProject(me, task.projectId);
  if (!canEditTask(me, task)) throw new Error("You can only move your own tasks.");
  await db.task.update({ where: { id: taskId }, data: { status: pick(status, TSTATUS, task.status) } });
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function updateTask(fd) {
  const me = await requireUser();
  const task = await db.task.findUnique({ where: { id: String(fd.get("id")) } });
  if (!task) throw new Error("Task not found.");
  await assertProject(me, task.projectId);
  if (!canEditTask(me, task)) throw new Error("You can't edit this task.");
  const manager = can(me, "manageAnyTask");
  await db.task.update({
    where: { id: task.id },
    data: {
      title: str(fd, "title") || task.title,
      description: str(fd, "description"),
      status: pick(str(fd, "status"), TSTATUS, task.status),
      priority: pick(str(fd, "priority"), PRIORITIES, task.priority),
      dueDate: parseDay(str(fd, "dueDate")),
      ...(manager && { assigneeId: str(fd, "assigneeId") }),
    },
  });
  revalidatePath(`/tasks/${task.id}`);
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}

export async function deleteTask(fd) {
  const me = await requireUser();
  const task = await db.task.findUnique({ where: { id: String(fd.get("id")) } });
  if (!task) throw new Error("Task not found.");
  if (!can(me, "manageAnyTask") && task.createdById !== me.id) throw new Error("You can't delete this task.");
  await db.task.delete({ where: { id: task.id } });
  redirect(`/projects/${task.projectId}`);
}

export async function addTaskComment(fd) {
  const me = await requireUser();
  const task = await db.task.findUnique({ where: { id: String(fd.get("taskId")) } });
  if (!task) throw new Error("Task not found.");
  await assertProject(me, task.projectId);
  const body = str(fd, "body");
  if (body) await db.taskComment.create({ data: { taskId: task.id, authorId: me.id, body } });
  revalidatePath(`/tasks/${task.id}`);
}

// ------------------------------------------------------- files & approvals
export async function uploadFiles(fd) {
  const me = await requireUser();
  const projectId = String(fd.get("projectId"));
  await assertProject(me, projectId);
  const dir = await ensureFilesDir();
  const sendForReview = fd.get("review") === "on";

  for (const file of fd.getAll("files")) {
    if (!(file instanceof File) || file.size === 0) continue;
    const ext = path.extname(file.name).slice(0, 12).replace(/[^.\w]/g, "");
    const storedName = `${randomUUID()}${ext}`;
    await pipeline(Readable.fromWeb(file.stream()), createWriteStream(path.join(dir, storedName)));
    await db.projectFile.create({
      data: {
        projectId,
        name: file.name.slice(0, 200),
        storedName,
        size: file.size,
        mime: file.type || "application/octet-stream",
        uploadedById: me.id,
        status: sendForReview ? "IN_REVIEW" : "DRAFT",
      },
    });
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function setFileStatus(fd) {
  const me = await requireUser();
  const file = await db.projectFile.findUnique({ where: { id: String(fd.get("id")) } });
  if (!file) throw new Error("File not found.");
  await assertProject(me, file.projectId);
  const status = str(fd, "status");
  // Anyone on the project can send a file for review; only reviewers decide.
  if (status === "IN_REVIEW" || status === "DRAFT") {
    if (file.uploadedById !== me.id && !can(me, "reviewFiles")) throw new Error("Not allowed.");
    await db.projectFile.update({ where: { id: file.id }, data: { status, reviewedById: null, reviewedAt: null } });
  } else if (status === "APPROVED" || status === "CHANGES_REQUESTED") {
    if (!can(me, "reviewFiles")) throw new Error("Only the creative director, CEO or project manager can review.");
    await db.projectFile.update({ where: { id: file.id }, data: { status, reviewedById: me.id, reviewedAt: new Date() } });
  }
  const note = str(fd, "note");
  if (note) await db.fileComment.create({ data: { fileId: file.id, authorId: me.id, body: note } });
  revalidatePath(`/projects/${file.projectId}`);
  revalidatePath("/");
}

/** Approve or request changes. Bound per button: reviewFile.bind(null, "APPROVED"). */
export async function reviewFile(status, fd) {
  if (status !== "APPROVED" && status !== "CHANGES_REQUESTED") throw new Error("Unknown decision.");
  fd.set("status", status);
  return setFileStatus(fd);
}

export async function addFileComment(fd) {
  const me = await requireUser();
  const file = await db.projectFile.findUnique({ where: { id: String(fd.get("fileId")) } });
  if (!file) throw new Error("File not found.");
  await assertProject(me, file.projectId);
  const body = str(fd, "body");
  if (body) await db.fileComment.create({ data: { fileId: file.id, authorId: me.id, body } });
  revalidatePath(`/projects/${file.projectId}`);
}

export async function deleteFile(fd) {
  const me = await requireUser();
  const file = await db.projectFile.findUnique({ where: { id: String(fd.get("id")) } });
  if (!file) throw new Error("File not found.");
  if (file.uploadedById !== me.id && !can(me, "reviewFiles")) throw new Error("Not allowed.");
  await db.projectFile.delete({ where: { id: file.id } });
  await unlink(filePath(file.storedName)).catch(() => {});
  revalidatePath(`/projects/${file.projectId}`);
}
