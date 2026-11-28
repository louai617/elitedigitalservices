"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { str } from "@/lib/guard";
import { canSeeProject } from "@/lib/access";

async function ownProject(user, projectId) {
  if (!(await canSeeProject(user, projectId))) throw new Error("Project not found.");
}

export async function sendClientMessage(fd) {
  const me = await requireClient();
  const projectId = String(fd.get("projectId"));
  await ownProject(me, projectId);
  const body = str(fd, "body");
  if (body) await db.projectMessage.create({ data: { projectId, authorId: me.id, body: body.slice(0, 5000) } });
  revalidatePath(`/portal/projects/${projectId}`);
}

/** The client approves a shared deliverable or asks for changes. Bound per button. */
export async function decideOnFile(decision, fd) {
  const me = await requireClient();
  if (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED") throw new Error("Unknown decision.");
  const file = await db.projectFile.findUnique({ where: { id: String(fd.get("id")) } });
  if (!file || !file.sharedWithClient) throw new Error("File not found.");
  await ownProject(me, file.projectId);
  await db.projectFile.update({ where: { id: file.id }, data: { clientStatus: decision, clientDecidedAt: new Date() } });
  // The decision (and any note) lands in the conversation, where the team sees it.
  const note = str(fd, "note");
  const verdict = decision === "APPROVED" ? "✅ Approved" : "✏️ Requested changes on";
  await db.projectMessage.create({
    data: { projectId: file.projectId, authorId: me.id, body: `${verdict} “${file.name}”${note ? `\n${note.slice(0, 4000)}` : ""}` },
  });
  revalidatePath(`/portal/projects/${file.projectId}`);
}
