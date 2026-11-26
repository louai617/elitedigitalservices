"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client-ui";
import { createUser, updateUser } from "./actions";

import { PALETTE as COLORS } from "@/lib/colors";

export default function UserForm({ user, roles, roleLabels, onDone, compact }) {
  const [state, action] = useActionState(user ? updateUser : createUser, null);
  return (
    <form action={action} className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
      {user && <input type="hidden" name="id" value={user.id} />}
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Full name</span>
        <input name="name" required defaultValue={user?.name} className="input" /></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Email</span>
        <input name="email" type="email" required={!user} disabled={!!user} defaultValue={user?.email} className="input disabled:opacity-60" /></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Role</span>
        <select name="role" defaultValue={user?.role || "STAFF"} className="input">
          {roles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
        </select></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Job title</span>
        <input name="title" defaultValue={user?.title || ""} placeholder="e.g. Photographer, Developer" className="input" /></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Phone</span>
        <input name="phone" defaultValue={user?.phone || ""} className="input" /></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">{user ? "New password (leave empty to keep)" : "Temporary password"}</span>
        <input name="password" type="text" minLength={10} required={!user} autoComplete="new-password" className="input" placeholder="At least 10 characters" /></label>
      <fieldset className="sm:col-span-2">
        <span className="mb-1.5 block text-xs text-mute">Calendar colour</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={user ? user.color === c : false} className="peer sr-only" />
              <span className="block h-7 w-7 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-panel peer-checked:ring-bone" style={{ background: c }} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>{user ? "Save changes" : "Create account"}</SubmitButton>
        {onDone && <button type="button" onClick={onDone} className="btn btn-ghost">Close</button>}
        {state?.error && <span className="text-sm text-red-300">{state.error}</span>}
        {state?.ok && <span className="text-sm text-emerald-300">{state.ok}</span>}
      </div>
    </form>
  );
}
