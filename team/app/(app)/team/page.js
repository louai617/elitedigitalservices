import { UserPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES, assignableRoles, can, canEditUser } from "@/lib/permissions";
import { Card, PageHeader } from "@/components/ui";
import TeamList from "./TeamList";
import UserForm from "./UserForm";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireUser();
  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, title: true, phone: true, color: true, active: true },
  });
  // Rank first, then name: leadership at the top of the list.
  users.sort((a, b) => ROLES[b.role].rank - ROLES[a.role].rank || Number(b.active) - Number(a.active));
  const roleLabels = Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, v.label]));
  const roles = assignableRoles(me);
  const editable = users.filter((u) => canEditUser(me, u)).map((u) => u.id);

  return (
    <>
      <PageHeader title="Team" subtitle={`${users.filter((u) => u.active).length} active members`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card bodyClass="">
          <TeamList users={users} editable={editable} roles={roles} roleLabels={roleLabels} meId={me.id} />
        </Card>
        {can(me, "manageUsers") && (
          <Card title={<span className="flex items-center gap-2"><UserPlus size={16} className="text-gold" />Add a team member</span>} className="h-fit">
            <UserForm roles={roles} roleLabels={roleLabels} compact />
          </Card>
        )}
      </div>
    </>
  );
}
