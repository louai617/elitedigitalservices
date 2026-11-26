"use client";

import { startTransition, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { saveEvent } from "./actions";

const TYPES = { MEETING: "Meeting", SHOOT: "Photo / video shoot", DEADLINE: "Deadline", OTHER: "Other" };
const CATS = { CAMERA: "Cameras", LENS: "Lenses", LIGHTING: "Lighting", AUDIO: "Audio", DRONE: "Drones", GRIP: "Grip & support", COMPUTER: "Computers", OTHER: "Other" };

export default function EventForm({ event, defaults, projects, users, equipment }) {
  const [state, action, pending] = useActionState(saveEvent, null);
  const [type, setType] = useState(event?.type || defaults.type || "MEETING");
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const byCat = Object.entries(CATS).map(([k, label]) => [label, equipment.filter((e) => e.category === k)]).filter(([, l]) => l.length);

  return (
    <form
      // Submitted by hand so a refused save (e.g. an equipment clash) keeps
      // everything the person typed; a plain form action would reset it.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-5 lg:grid-cols-2"
    >
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Title *</span>
          <input name="title" required defaultValue={event?.title} placeholder="e.g. Clinic shoot — Dr. Reem" className="input" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block text-xs text-mute">Type</span>
            <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="input">
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>
          <label className="block"><span className="mb-1.5 block text-xs text-mute">Project</span>
            <select name="projectId" defaultValue={event?.projectId || defaults.projectId || ""} className="input">
              <option value="">— None —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
        </div>
        <label className="flex items-center gap-2 text-sm text-mute">
          <input type="checkbox" name="allDay" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-[#EAB877]" /> All day
        </label>
        {allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs text-mute">From</span><input type="date" name="startDay" required defaultValue={defaults.startDay} className="input" /></label>
            <label className="block"><span className="mb-1.5 block text-xs text-mute">To</span><input type="date" name="endDay" defaultValue={defaults.endDay} className="input" /></label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs text-mute">Starts</span><input type="datetime-local" name="start" required defaultValue={defaults.start} className="input" /></label>
            <label className="block"><span className="mb-1.5 block text-xs text-mute">Ends</span><input type="datetime-local" name="end" required defaultValue={defaults.end} className="input" /></label>
          </div>
        )}
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Location</span>
          <input name="location" defaultValue={event?.location || ""} placeholder={type === "SHOOT" ? "Studio, client address, Google Maps link…" : "Office, Zoom link…"} className="input" /></label>
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Notes</span>
          <textarea name="notes" rows={3} defaultValue={event?.notes || ""} placeholder={type === "SHOOT" ? "Shot list, wardrobe, call time…" : ""} className="input" /></label>
      </div>

      <div className="space-y-5">
        <fieldset>
          <span className="mb-2 block text-xs font-medium text-mute">{type === "SHOOT" ? "Crew" : "Who's coming"}</span>
          <div className="scroll-thin grid max-h-56 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {users.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5">
                <input type="checkbox" name="attendees" value={u.id} defaultChecked={(event?.attendeeIds || defaults.attendeeIds || []).includes(u.id)} className="accent-[#EAB877]" />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: u.color }} />
                <span className="truncate">{u.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {(type === "SHOOT" || (event?.equipmentIds || []).length > 0) && equipment.length > 0 && (
          <fieldset>
            <span className="mb-2 block text-xs font-medium text-mute">Equipment — booked for the event's times; clashes are refused</span>
            <div className="scroll-thin max-h-72 space-y-3 overflow-y-auto">
              {byCat.map(([label, items]) => (
                <div key={label}>
                  <p className="mb-1 text-[11px] uppercase tracking-wider text-mute/70">{label}</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {items.map((e) => (
                      <label key={e.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5">
                        <input type="checkbox" name="equipment" value={e.id} defaultChecked={(event?.equipmentIds || []).includes(e.id)} className="accent-[#EAB877]" />
                        <span className="truncate">{e.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending && <Loader2 size={15} className="animate-spin" />}{event ? "Save event" : "Add to calendar"}</button>
        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      </div>
    </form>
  );
}
