"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client-ui";
import { changePassword, updateProfile } from "./actions";

import { PALETTE as COLORS } from "@/lib/colors";

function Msg({ state }) {
  if (state?.error) return <span className="text-sm text-red-300">{state.error}</span>;
  if (state?.ok) return <span className="text-sm text-emerald-300">{state.ok}</span>;
  return null;
}

export function ProfileForm({ user }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Name</span>
        <input name="name" defaultValue={user.name} className="input" /></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Phone</span>
        <input name="phone" defaultValue={user.phone || ""} className="input" /></label>
      <fieldset>
        <span className="mb-1.5 block text-xs text-mute">Calendar colour</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={user.color === c} className="peer sr-only" />
              <span className="block h-7 w-7 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-panel peer-checked:ring-bone" style={{ background: c }} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3"><SubmitButton>Save</SubmitButton><Msg state={state} /></div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Current password</span>
        <input name="current" type="password" autoComplete="current-password" required className="input" /></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">New password</span>
        <input name="next" type="password" autoComplete="new-password" minLength={10} required className="input" /></label>
      <label className="block"><span className="mb-1.5 block text-xs text-mute">Repeat new password</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className="input" /></label>
      <div className="flex items-center gap-3"><SubmitButton>Change password</SubmitButton><Msg state={state} /></div>
    </form>
  );
}
