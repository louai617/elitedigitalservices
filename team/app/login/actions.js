"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, loginThrottled, recordFailedLogin, verifyPassword } from "@/lib/auth";

export async function login(_prev, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Enter your email and password." };
  if (await loginThrottled(email)) return { error: "Too many attempts. Try again in 15 minutes." };

  const user = await db.user.findUnique({ where: { email } });
  // Compare even when the user doesn't exist, so timing doesn't reveal accounts.
  const ok = await verifyPassword(password, user?.passwordHash || "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !ok || !user.active) {
    await recordFailedLogin(email);
    return { error: "Email or password is incorrect." };
  }
  await createSession(user.id);
  redirect(user.role === "CLIENT" ? "/portal" : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
