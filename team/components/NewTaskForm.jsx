import { Plus } from "lucide-react";
import { PRIORITY } from "@/lib/format";
import { SubmitButton } from "./client-ui";
import { createTask } from "@/app/(app)/projects/actions";

/** Collapsible "add task" form. Staff only get "assign to me". */
export default function NewTaskForm({ projectId, members, canAssign, meId }) {
  return (
    <details className="card group mb-5 open:pb-1">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-semibold text-gold">
        <Plus size={16} className="transition group-open:rotate-45" /> Add a task
      </summary>
      <form action={createTask} className="grid gap-3 border-t border-line p-5 md:grid-cols-6">
        <input type="hidden" name="projectId" value={projectId} />
        <input name="title" required placeholder="What needs doing? *" className="input md:col-span-6" />
        <textarea name="description" rows={2} placeholder="Details (optional)" className="input md:col-span-6" />
        {canAssign ? (
          <select name="assigneeId" className="input md:col-span-2" defaultValue="">
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        ) : (
          <label className="flex items-center gap-2 text-sm text-mute md:col-span-2">
            <input type="checkbox" name="assigneeId" value={meId} defaultChecked className="accent-[#EAB877]" /> Assign to me
          </label>
        )}
        <select name="priority" defaultValue="MEDIUM" className="input md:col-span-2">
          {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label} priority</option>)}
        </select>
        <input type="date" name="dueDate" className="input md:col-span-2" aria-label="Due date" />
        <div className="md:col-span-6"><SubmitButton className="btn btn-primary btn-sm">Add task</SubmitButton></div>
      </form>
    </details>
  );
}
