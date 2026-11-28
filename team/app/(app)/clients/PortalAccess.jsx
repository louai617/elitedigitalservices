"use client";

import { useActionState, useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { SubmitButton } from "@/components/client-ui";
import { createPortalUser, resetPortalPassword, setPortalUserActive } from "./actions";

function Msg({ state }) {
  if (state?.error) return <p className="text-xs text-red-300">{state.error}</p>;
  if (state?.ok) return <p className="text-xs text-emerald-300">{state.ok}</p>;
  return null;
}

function ResetPassword({ id }) {
  const [state, action] = useActionState(resetPortalPassword, null);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="password" type="text" minLength={10} required placeholder="New password (10+ chars)" className="input max-w-56 py-1.5 text-xs" />
      <SubmitButton className="btn btn-ghost btn-sm">Set</SubmitButton>
      <Msg state={state} />
    </form>
  );
}

/** Portal logins for one client: who can sign in, add one, reset, switch off. */
export default function PortalAccess({ clientId, users }) {
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(null);
  const [state, action] = useActionState(createPortalUser, null);

  return (
    <div className="mt-3 rounded-xl border border-line bg-panel-2/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-mute">Client portal access</p>
        <button type="button" onClick={() => setAdding(!adding)} className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
          <UserPlus size={13} /> Add login
        </button>
      </div>
      {users.length === 0 && !adding && <p className="mt-1.5 text-xs text-mute">No logins yet — add one so the client can follow progress.</p>}
      <ul className="mt-2 space-y-2">
        {users.map((u) => (
          <li key={u.id} className="text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={u.active ? "" : "text-mute line-through"}>{u.name}</span>
              <span className="text-xs text-mute">{u.email}</span>
              <span className="ml-auto flex gap-2">
                <button type="button" onClick={() => setResetting(resetting === u.id ? null : u.id)} className="inline-flex items-center gap-1 text-xs text-mute hover:text-gold"><KeyRound size={12} />Password</button>
                <form action={setPortalUserActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={String(!u.active)} />
                  <button className="text-xs text-mute hover:text-gold">{u.active ? "Disable" : "Enable"}</button>
                </form>
              </span>
            </div>
            {resetting === u.id && <ResetPassword id={u.id} />}
          </li>
        ))}
      </ul>
      {adding && (
        <form action={action} className="mt-3 grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="clientId" value={clientId} />
          <input name="name" required placeholder="Their name" className="input py-1.5 text-sm" />
          <input name="email" type="email" required placeholder="Their email" className="input py-1.5 text-sm" />
          <input name="password" type="text" minLength={10} required placeholder="Password (10+ chars)" className="input py-1.5 text-sm" />
          <div className="flex items-center gap-3 sm:col-span-3">
            <SubmitButton className="btn btn-primary btn-sm">Create login</SubmitButton>
            <Msg state={state} />
          </div>
        </form>
      )}
    </div>
  );
}
