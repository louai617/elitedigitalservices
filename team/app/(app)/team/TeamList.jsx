"use client";

import { useState } from "react";
import { Pencil, Mail, Phone } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { ConfirmButton } from "@/components/client-ui";
import UserForm from "./UserForm";
import { setActive } from "./actions";

export default function TeamList({ users, editable, roles, roleLabels, meId }) {
  const [editing, setEditing] = useState(null);
  return (
    <ul className="divide-y divide-line">
      {users.map((u) => (
        <li key={u.id} className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar user={u} size={40} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {u.name}
                <Badge tone={["CEO", "PROJECT_MANAGER"].includes(u.role) ? "gold" : "slate"}>{roleLabels[u.role]}</Badge>
                {!u.active && <Badge tone="red">Deactivated</Badge>}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mute">
                {u.title && <span>{u.title}</span>}
                <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1 hover:text-gold"><Mail size={13} />{u.email}</a>
                {u.phone && <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1 hover:text-gold"><Phone size={13} />{u.phone}</a>}
              </p>
            </div>
            {editable.includes(u.id) && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(editing === u.id ? null : u.id)} className="btn btn-ghost btn-sm"><Pencil size={14} />Edit</button>
                {u.id !== meId && (
                  <form action={setActive}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="active" value={String(!u.active)} />
                    {u.active
                      ? <ConfirmButton message={`Deactivate ${u.name}? They will be signed out and can't sign in.`}>Deactivate</ConfirmButton>
                      : <button className="btn btn-ghost btn-sm">Reactivate</button>}
                  </form>
                )}
              </div>
            )}
          </div>
          {editing === u.id && (
            <div className="mt-4 rounded-xl border border-line bg-panel-2 p-4">
              <UserForm user={u} roles={roles.includes(u.role) ? roles : [u.role, ...roles]} roleLabels={roleLabels} onDone={() => setEditing(null)} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
