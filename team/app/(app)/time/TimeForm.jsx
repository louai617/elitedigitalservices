"use client";

import { startTransition, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { logTime } from "./actions";

export default function TimeForm({ projects, tasks, defaults }) {
  const [state, action, pending] = useActionState(logTime, null);
  const [projectId, setProjectId] = useState(defaults.projectId || "");
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          await action(fd);
          form.querySelector("[name=duration]").value = "";
          form.querySelector("[name=note]").value = "";
        });
      }}
      className="space-y-3"
    >
      <select name="projectId" required value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input">
        <option value="" disabled>Project…</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select name="taskId" defaultValue={defaults.taskId || ""} key={projectId} className="input" disabled={!projectTasks.length}>
        <option value="">{projectTasks.length ? "Task (optional)" : "No open tasks"}</option>
        {projectTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" name="date" required defaultValue={defaults.date} className="input" aria-label="Date" />
        <input name="duration" required placeholder="Hours, e.g. 1.5" inputMode="decimal" className="input" />
      </div>
      <input name="note" placeholder="What did you work on?" className="input" />
      <button disabled={pending} className="btn btn-primary">{pending && <Loader2 size={15} className="animate-spin" />}Log time</button>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-300">{state.ok}</p>}
    </form>
  );
}
