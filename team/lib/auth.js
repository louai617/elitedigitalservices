import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const SESSION_COOKIE = "ems_team_session";
const SESSION_DAYS = 30;

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function validatePassword(password) {
  if (!password || password.length < 10) return "Password must be at least 10 characters.";
  return null;
}

/** Start a session: random token in an httpOnly cookie, only its hash in the database. */
export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** The signed-in, active user, or null. */
export async function getUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return session.user;
}

/**
 * For staff pages and actions: a signed-in staff member. Client accounts are
 * sent to their portal, so nothing in the staff app is reachable by them.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role === "CLIENT") redirect("/portal");
  return user;
}

/** For portal pages and actions: a signed-in client account with a company. */
export async function requireClient() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/");
  if (!user.clientId) redirect("/login");
  return user;
}

/** Either kind of account — only for things both may do (their own password). */
export async function requireAnyUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

// ---- Login rate limiting (per IP and per email), in memory --------------
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX = 8;

export async function loginThrottled(email) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  for (const key of [`ip:${ip}`, `email:${email}`]) {
    const list = (attempts.get(key) || []).filter((t) => now - t < WINDOW);
    attempts.set(key, list);
    if (list.length >= MAX) return true;
  }
  return false;
}

export async function recordFailedLogin(email) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  for (const key of [`ip:${ip}`, `email:${email}`]) {
    attempts.set(key, [...(attempts.get(key) || []), Date.now()]);
  }
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
