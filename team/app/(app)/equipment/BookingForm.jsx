"use client";

import { startTransition, useActionState } from "react";
import { Loader2 } from "lucide-react";
import { bookEquipment } from "./actions";

export default function BookingForm({ equipment, defaults }) {
  const [state, action, pending] = useActionState(bookEquipment, null);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }}
      className="space-y-3"
    >
      <select name="equipmentId" required defaultValue="" className="input">
        <option value="" disabled>Choose equipment…</option>
        {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="mb-1 block text-xs text-mute">From</span><input type="datetime-local" name="start" required defaultValue={defaults.start} className="input" /></label>
        <label className="block"><span className="mb-1 block text-xs text-mute">Until</span><input type="datetime-local" name="end" required defaultValue={defaults.end} className="input" /></label>
      </div>
      <input name="note" placeholder="What for? (optional)" className="input" />
      <button disabled={pending} className="btn btn-primary">{pending && <Loader2 size={15} className="animate-spin" />}Book</button>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-300">{state.ok}</p>}
    </form>
  );
}
