"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth";
import { requireCan, str } from "@/lib/guard";
import { assignableRoles, canEditUser } from "@/lib/permissions";
import { colorForIndex } from "@/lib/colors";

export async function createUser(_prev, fd) {
  const me = await requireCan("manageUsers");
  const email = str(fd, "email")?.toLowerCase();
  const name = str(fd, "name");
  const role = str(fd, "role") || "STAFF";
  const password = String(fd.get("password") || "");
  if (!email || !name) return { error: "Name and email are required." };
  if (!assignableRoles(me).includes(role)) return { error: "You can't assign that role." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };
  if (await db.user.findUnique({ where: { email } })) return { error: "Someone already uses that email." };

  await db.user.create({
    data: {
      email, name, role,
      title: str(fd, "title"),
      phone: str(fd, "phone"),
      color: str(fd, "color") || colorForIndex(await db.user.count()),
      passwordHash: await hashPassword(password),
    },
  });
  revalidatePath("/team");
  return { ok: `${name} can now sign in with ${email}.` };
}

export async function updateUser(_prev, fd) {
  const me = await requireCan("manageUsers");
  const target = await db.user.findUnique({ where: { id: String(fd.get("id")) } });
  if (!target || !canEditUser(me, target)) return { error: "You can't edit this account." };
  const role = str(fd, "role") || target.role;
  if (role !== target.role && !assignableRoles(me).includes(role)) return { error: "You can't assign that role." };
  if (target.id === me.id && role !== me.role) return { error: "You can't change your own role." };

  const data = {
    name: str(fd, "name") || target.name,
    title: str(fd, "title"),
    phone: str(fd, "phone"),
    color: str(fd, "color") || target.color,
    role,
  };
  const password = String(fd.get("password") || "");
  if (password) {
    const pwError = validatePassword(password);
    if (pwError) return { error: pwError };
    data.passwordHash = await hashPassword(password);
  }
  await db.user.update({ where: { id: target.id }, data });
  // A new password signs the person out everywhere.
  if (password) await db.session.deleteMany({ where: { userId: target.id } });
  revalidatePath("/team");
  return { ok: "Saved." };
}

export async function setActive(fd) {
  const me = await requireCan("manageUsers");
  const target = await db.user.findUnique({ where: { id: String(fd.get("id")) } });
  if (!target || !canEditUser(me, target) || target.id === me.id) throw new Error("Not allowed.");
  const active = fd.get("active") === "true";
  await db.user.update({ where: { id: target.id }, data: { active } });
  if (!active) await db.session.deleteMany({ where: { userId: target.id } });
  revalidatePath("/team");
}
