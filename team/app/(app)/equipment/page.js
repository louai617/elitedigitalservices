import Link from "next/link";
import { Camera } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { EQUIPMENT_CATEGORIES, dohaDay, fmtDateTime } from "@/lib/format";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { ConfirmButton, SubmitButton } from "@/components/client-ui";
import BookingForm from "./BookingForm";
import { cancelBooking, saveEquipment, toggleEquipment } from "./actions";

export const metadata = { title: "Equipment" };

function EquipmentFields({ item }) {
  return (
    <>
      {item && <input type="hidden" name="id" value={item.id} />}
      <input name="name" required defaultValue={item?.name} placeholder="e.g. Sony FX3 #1 *" className="input" />
      <div className="grid grid-cols-2 gap-3">
        <select name="category" defaultValue={item?.category || "CAMERA"} className="input">
          {Object.entries(EQUIPMENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input name="serial" defaultValue={item?.serial || ""} placeholder="Serial no." className="input" />
      </div>
      <input name="notes" defaultValue={item?.notes || ""} placeholder="Notes (kit contents, condition…)" className="input" />
    </>
  );
}

export default async function EquipmentPage({ searchParams }) {
  const me = await requireUser();
  const { edit } = await searchParams;
  const manage = can(me, "manageEquipment");
  const now = new Date();
  const items = await db.equipment.findMany({
    where: manage ? {} : { active: true },
    orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
    include: {
      bookings: {
        where: { end: { gte: now } },
        orderBy: { start: "asc" },
        take: 4,
        include: { user: { select: { id: true, name: true } }, event: { select: { id: true, title: true } } },
      },
    },
  });
  const today = dohaDay(now);

  return (
    <>
      <PageHeader title="Equipment" subtitle="Cameras, lenses, lights and more — see what's free and book it" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="card"><Empty icon={Camera} title="No equipment yet">{manage ? "Add your kit on the right." : "Ask an admin to add the kit."}</Empty></div>
          ) : (
            Object.entries(EQUIPMENT_CATEGORIES).map(([cat, label]) => {
              const list = items.filter((i) => i.category === cat);
              if (!list.length) return null;
              return (
                <Card key={cat} title={label} bodyClass="">
                  <ul className="divide-y divide-line">
                    {list.map((item) => {
                      const current = item.bookings.find((b) => b.start <= now && b.end >= now);
                      return (
                        <li key={item.id} className="px-5 py-4">
                          {edit === item.id && manage ? (
                            <form action={saveEquipment} className="space-y-3">
                              <EquipmentFields item={item} />
                              <div className="flex gap-2"><SubmitButton className="btn btn-primary btn-sm">Save</SubmitButton><Link href="/equipment" className="btn btn-ghost btn-sm">Cancel</Link></div>
                            </form>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-medium">{item.name}</span>
                                {!item.active ? <Badge tone="slate">Retired</Badge> : current ? <Badge tone="gold">In use · {current.user.name}</Badge> : <Badge tone="green">Available now</Badge>}
                                {item.serial && <span className="text-xs text-mute">S/N {item.serial}</span>}
                                {manage && (
                                  <span className="ml-auto flex gap-2">
                                    <Link href={`/equipment?edit=${item.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                                    <form action={toggleEquipment}>
                                      <input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(!item.active)} />
                                      <button className="btn btn-ghost btn-sm">{item.active ? "Retire" : "Restore"}</button>
                                    </form>
                                  </span>
                                )}
                              </div>
                              {item.notes && <p className="mt-1 text-sm text-mute">{item.notes}</p>}
                              {item.bookings.length > 0 && (
                                <ul className="mt-3 space-y-1.5">
                                  {item.bookings.map((b) => (
                                    <li key={b.id} className="flex flex-wrap items-center gap-2 text-xs text-mute">
                                      <span className={`rounded-md px-2 py-0.5 ${dohaDay(b.start) === today ? "bg-gold/10 text-gold" : "bg-white/5"}`}>{fmtDateTime(b.start)} → {fmtDateTime(b.end)}</span>
                                      <span>{b.user.name}</span>
                                      {b.event ? <Link href={`/calendar/${b.event.id}`} className="text-gold hover:underline">{b.event.title}</Link> : b.note && <span>· {b.note}</span>}
                                      {!b.eventId && (b.user.id === me.id || manage) && (
                                        <form action={cancelBooking}><input type="hidden" name="id" value={b.id} /><ConfirmButton message="Cancel this booking?" className="text-red-300 hover:underline">Cancel</ConfirmButton></form>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })
          )}
        </div>
        <div className="space-y-6">
          <Card title="Book equipment" className="h-fit">
            <p className="mb-4 text-xs text-mute">For shoots, add the equipment to the shoot in the calendar instead — it's booked for the shoot's times automatically.</p>
            <BookingForm equipment={items.filter((i) => i.active).map((i) => ({ id: i.id, name: i.name }))} defaults={{ start: `${today}T09:00`, end: `${today}T18:00` }} />
          </Card>
          {manage && (
            <Card title="Add equipment" className="h-fit">
              <form action={saveEquipment} className="space-y-3"><EquipmentFields /><SubmitButton>Add</SubmitButton></form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
