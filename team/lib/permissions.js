/**
 * Who can do what. CEO and Project Manager have full access; every check in
 * the app goes through `can()`, so changing a rule here changes it everywhere.
 */
export const ROLES = {
  CEO: { label: "CEO", rank: 4 },
  PROJECT_MANAGER: { label: "Project Manager", rank: 4 },
  ADMIN: { label: "Admin", rank: 3 },
  CREATIVE_DIRECTOR: { label: "Creative Director", rank: 3 },
  STAFF: { label: "Staff", rank: 1 },
};

const FULL = ["CEO", "PROJECT_MANAGER"];

const RULES = {
  manageUsers: [...FULL, "ADMIN"],
  manageClients: [...FULL, "ADMIN", "CREATIVE_DIRECTOR"],
  createProject: [...FULL, "CREATIVE_DIRECTOR"],
  editProject: [...FULL, "CREATIVE_DIRECTOR"],
  deleteProject: FULL,
  seeAllProjects: [...FULL, "ADMIN", "CREATIVE_DIRECTOR"],
  manageAnyTask: [...FULL, "CREATIVE_DIRECTOR"],
  reviewFiles: [...FULL, "CREATIVE_DIRECTOR"],
  manageEquipment: [...FULL, "ADMIN"],
  approveLeave: [...FULL, "ADMIN"],
  viewAllTime: [...FULL, "ADMIN", "CREATIVE_DIRECTOR"],
  manageAnyEvent: [...FULL, "ADMIN", "CREATIVE_DIRECTOR"],
};

export function can(user, action) {
  if (!user?.active) return false;
  if (FULL.includes(user.role)) return true;
  return (RULES[action] || []).includes(user.role);
}

export const isFull = (user) => FULL.includes(user?.role);

/** Roles a user may hand out. Only CEO/PM can create CEO/PM accounts. */
export function assignableRoles(user) {
  if (isFull(user)) return Object.keys(ROLES);
  if (can(user, "manageUsers")) return ["ADMIN", "CREATIVE_DIRECTOR", "STAFF"];
  return [];
}

/** Whether `user` may edit the account `target`. Admins cannot touch CEO/PM accounts. */
export function canEditUser(user, target) {
  if (!can(user, "manageUsers")) return false;
  if (isFull(user)) return true;
  return !FULL.includes(target.role);
}

/** Prisma filter for the projects a user may see. */
export function projectScope(user) {
  return can(user, "seeAllProjects") ? {} : { members: { some: { userId: user.id } } };
}

/** Staff may change tasks assigned to them or created by them; managers any task. */
export function canEditTask(user, task) {
  return can(user, "manageAnyTask") || task.assigneeId === user.id || task.createdById === user.id;
}

export function canEditEvent(user, event) {
  return can(user, "manageAnyEvent") || event.createdById === user.id;
}
