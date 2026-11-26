import { requireUser } from "@/lib/auth";
import { eventFormOptions } from "@/lib/event-form-data";
import { dohaDay } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import EventForm from "../EventForm";

export const metadata = { title: "New event" };

export default async function NewEventPage({ searchParams }) {
  const me = await requireUser();
  const sp = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date || "") ? sp.date : dohaDay(new Date());
  const options = await eventFormOptions(me);
  const defaults = {
    type: sp.type === "SHOOT" ? "SHOOT" : "MEETING",
    projectId: sp.project || "",
    start: `${date}T10:00`,
    end: `${date}T11:00`,
    startDay: date,
    endDay: date,
    attendeeIds: [me.id],
  };
  return (
    <>
      <PageHeader title="New event" subtitle="Meetings, shoots and deadlines appear on everyone's calendar" />
      <Card className="max-w-5xl"><EventForm defaults={defaults} {...options} /></Card>
    </>
  );
}
