"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { SubmitButton } from "@/components/client-ui";

export default function LoginForm() {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-mute">Email</span>
        <input name="email" type="email" autoComplete="username" required className="input" placeholder="you@elitemedia.qa" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-mute">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="input" />
      </label>
      {state?.error && <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-200">{state.error}</p>}
      <SubmitButton className="btn btn-primary w-full py-3" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
