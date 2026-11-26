import "server-only";
import { requireUser } from "./auth";
import { can } from "./permissions";

/** For server actions: the signed-in user, refusing if they lack `action`. */
export async function requireCan(action) {
  const user = await requireUser();
  if (action && !can(user, action)) throw new Error("You don't have permission to do that.");
  return user;
}

export const str = (fd, key) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
