"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, requireAnyUser as requireUser, validatePassword, verifyPassword, createSession } from "@/lib/auth";
import { str } from "@/lib/guard";

export async function updateProfile(_prev, fd) {
  const me = await requireUser();
  await db.user.update({
    where: { id: me.id },
    data: { name: str(fd, "name") || me.name, phone: str(fd, "phone"), color: str(fd, "color") || me.color },
  });
  revalidatePath("/", "layout");
  revalidatePath("/portal", "layout");
  return { ok: "Profile saved." };
}

export async function changePassword(_prev, fd) {
  const me = await requireUser();
  const current = String(fd.get("current") || "");
  const next = String(fd.get("next") || "");
  if (!(await verifyPassword(current, me.passwordHash))) return { error: "Current password is incorrect." };
  const pwError = validatePassword(next);
  if (pwError) return { error: pwError };
  if (next !== fd.get("confirm")) return { error: "The new passwords don't match." };
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(next) } });
  // Sign out every other device, keep this one.
  await db.session.deleteMany({ where: { userId: me.id } });
  await createSession(me.id);
  return { ok: "Password changed. Other devices were signed out." };
}
