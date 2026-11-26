import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { Card, PageHeader } from "@/components/ui";
import { PasswordForm, ProfileForm } from "./ProfileForms";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const me = await requireUser();
  return (
    <>
      <PageHeader title="My profile" subtitle={`${me.email} · ${ROLES[me.role].label}${me.title ? ` · ${me.title}` : ""}`} />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Card title="Details"><ProfileForm user={{ name: me.name, phone: me.phone, color: me.color }} /></Card>
        <Card title="Password"><PasswordForm /></Card>
      </div>
    </>
  );
}
