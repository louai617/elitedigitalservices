import Link from "next/link";
import { Building2, Mail, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, projectScope } from "@/lib/permissions";
import { Card, Empty, PageHeader } from "@/components/ui";
import { ConfirmButton, SubmitButton } from "@/components/client-ui";
import { deleteClient, saveClient } from "./actions";

export const metadata = { title: "Clients" };

function ClientFields({ c }) {
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <input name="name" required defaultValue={c?.name} placeholder="Contact or brand name *" className="input" />
      <input name="company" defaultValue={c?.company || ""} placeholder="Company" className="input" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="email" type="email" defaultValue={c?.email || ""} placeholder="Email" className="input" />
        <input name="phone" defaultValue={c?.phone || ""} placeholder="Phone" className="input" />
      </div>
      <textarea name="notes" rows={2} defaultValue={c?.notes || ""} placeholder="Notes" className="input" />
    </>
  );
}

export default async function ClientsPage({ searchParams }) {
  const me = await requireUser();
  const { edit } = await searchParams;
  const manage = can(me, "manageClients");
  const clients = await db.client.findMany({
    orderBy: { name: "asc" },
    include: { projects: { where: projectScope(me), select: { id: true, name: true, status: true } } },
  });

  return (
    <>
      <PageHeader title="Clients" subtitle={`${clients.length} clients`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card bodyClass="">
          {clients.length === 0 ? (
            <Empty icon={Building2} title="No clients yet">Add your first client on the right.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {clients.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  {edit === c.id && manage ? (
                    <form action={saveClient} className="space-y-3">
                      <ClientFields c={c} />
                      <div className="flex gap-2"><SubmitButton className="btn btn-primary btn-sm">Save</SubmitButton><Link href="/clients" className="btn btn-ghost btn-sm">Cancel</Link></div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 font-semibold text-gold">{c.name[0]}</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{c.name}{c.company && <span className="text-mute"> · {c.company}</span>}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-mute">
                          {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-gold"><Mail size={13} />{c.email}</a>}
                          {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-gold"><Phone size={13} />{c.phone}</a>}
                        </p>
                        {c.notes && <p className="mt-1 text-sm text-mute/80">{c.notes}</p>}
                        {c.projects.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {c.projects.map((p) => (
                              <Link key={p.id} href={`/projects/${p.id}`} className="rounded-full border border-line px-2.5 py-0.5 text-xs hover:border-gold hover:text-gold">{p.name}</Link>
                            ))}
                          </div>
                        )}
                      </div>
                      {manage && (
                        <div className="flex gap-2">
                          <Link href={`/clients?edit=${c.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                          <form action={deleteClient}>
                            <input type="hidden" name="id" value={c.id} />
                            <ConfirmButton message={`Delete ${c.name}? Their projects stay, without a client.`}>Delete</ConfirmButton>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {manage && (
          <Card title="Add a client" className="h-fit">
            <form action={saveClient} className="space-y-3">
              <ClientFields />
              <SubmitButton>Add client</SubmitButton>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
