import { requireClient } from "@/lib/auth";
import { Card } from "@/components/ui";
import { PasswordForm } from "@/app/(app)/profile/ProfileForms";

export const metadata = { title: "My account" };

export default async function PortalAccount() {
  const me = await requireClient();
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">My account</h1>
      <p className="mb-8 text-sm text-mute">{me.name} · {me.email}</p>
      <Card title="Change password" className="max-w-md"><PasswordForm /></Card>
    </>
  );
}
