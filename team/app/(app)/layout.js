import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, ROLES } from "@/lib/permissions";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }) {
  const user = await requireUser();

  // Badges: what is waiting on this person.
  const [pendingLeave, filesToReview, openTasks] = await Promise.all([
    can(user, "approveLeave") ? db.leaveRequest.count({ where: { status: "PENDING" } }) : 0,
    can(user, "reviewFiles") ? db.projectFile.count({ where: { status: "IN_REVIEW" } }) : 0,
    db.task.count({ where: { assigneeId: user.id, status: { not: "DONE" } } }),
  ]);

  const nav = [
    { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/projects", label: "Projects", icon: "FolderKanban", badge: filesToReview },
    { href: "/tasks", label: "My tasks", icon: "ListChecks", badge: openTasks },
    { href: "/calendar", label: "Calendar", icon: "CalendarDays" },
    { href: "/equipment", label: "Equipment", icon: "Camera" },
    { href: "/clients", label: "Clients", icon: "Building2" },
    ...(can(user, "managePortfolio") ? [{ href: "/portfolio", label: "Portfolio", icon: "Images" }] : []),
    { href: "/time", label: "Time", icon: "Clock" },
    { href: "/leave", label: "Leave", icon: "Palmtree", badge: pendingLeave },
    { href: "/team", label: "Team", icon: "Users" },
  ];

  const safeUser = { id: user.id, name: user.name, color: user.color };
  return (
    <div className="min-h-screen">
      <Sidebar user={safeUser} roleLabel={user.title || ROLES[user.role].label} nav={nav} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
