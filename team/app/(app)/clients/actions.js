"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCan, str } from "@/lib/guard";
import { hashPassword, validatePassword } from "@/lib/auth";

const fields = (fd) => ({
  name: str(fd, "name"),
  company: str(fd, "company"),
  email: str(fd, "email"),
  phone: str(fd, "phone"),
  notes: str(fd, "notes"),
});

export async function saveClient(fd) {
  await requireCan("manageClients");
  const data = fields(fd);
  if (!data.name) throw new Error("Client name is required.");
  const id = str(fd, "id");
  if (id) await db.client.update({ where: { id }, data });
  else await db.client.create({ data });
  revalidatePath("/clients");
}

export async function deleteClient(fd) {
  await requireCan("manageClients");
  await db.client.delete({ where: { id: String(fd.get("id")) } });
  revalidatePath("/clients");
}

// ---------------------------------------------------------- portal logins

/** A login for someone at the client, to follow their projects in the portal. */
export async function createPortalUser(_prev, fd) {
  await requireCan("manageClients");
  const clientId = str(fd, "clientId");
  const name = str(fd, "name");
  const email = str(fd, "email")?.toLowerCase();
  const password = String(fd.get("password") || "");
  if (!clientId || !name || !email) return { error: "Name and email are required." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };
  if (!(await db.client.findUnique({ where: { id: clientId } }))) return { error: "Unknown client." };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email already has an account." };
  await db.user.create({
    data: { name, email, role: "CLIENT", clientId, passwordHash: await hashPassword(password), color: "#9A9AA3" },
  });
  revalidatePath("/clients");
  return { ok: `${name} can sign in with ${email}. Send them the password privately.` };
}

async function portalUser(fd) {
  await requireCan("manageClients");
  const user = await db.user.findUnique({ where: { id: String(fd.get("id")) } });
  if (!user || user.role !== "CLIENT") throw new Error("Not a client account.");
  return user;
}

export async function setPortalUserActive(fd) {
  const user = await portalUser(fd);
  const active = fd.get("active") === "true";
  await db.user.update({ where: { id: user.id }, data: { active } });
  if (!active) await db.session.deleteMany({ where: { userId: user.id } });
  revalidatePath("/clients");
}

export async function resetPortalPassword(_prev, fd) {
  const user = await portalUser(fd);
  const password = String(fd.get("password") || "");
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await db.session.deleteMany({ where: { userId: user.id } });
  return { ok: "Password changed. Send it to them privately." };
}
