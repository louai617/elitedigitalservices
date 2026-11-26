import { PROJECT_STATUS, SERVICE_LABELS, dohaDay } from "@/lib/format";
import { Avatar, Field } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";

const day = (d) => (d ? dohaDay(d) : "");

export default function ProjectForm({ action, project, clients, users, memberIds = [] }) {
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      {project && <input type="hidden" name="id" value={project.id} />}
      <Field label="Project name *" className="md:col-span-2">
        <input name="name" required defaultValue={project?.name} className="input" placeholder="e.g. Clinica Joelle — doctor films" />
      </Field>
      <Field label="Client">
        <select name="clientId" defaultValue={project?.clientId || ""} className="input">
          <option value="">— No client —</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
        </select>
      </Field>
      <Field label="Service">
        <select name="service" defaultValue={project?.service || "PROGRAMMING"} className="input">
          {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={project?.status || "PLANNING"} className="input">
          {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start"><input type="date" name="startDate" defaultValue={day(project?.startDate)} className="input" /></Field>
        <Field label="Deadline"><input type="date" name="dueDate" defaultValue={day(project?.dueDate)} className="input" /></Field>
      </div>
      <Field label="Brief" className="md:col-span-2">
        <textarea name="description" rows={4} defaultValue={project?.description || ""} className="input" placeholder="Goals, deliverables, links…" />
      </Field>
      <fieldset className="md:col-span-2">
        <span className="mb-2 block text-xs font-medium text-mute">Team</span>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5">
              <input type="checkbox" name="members" value={u.id} defaultChecked={memberIds.includes(u.id)} className="accent-[#EAB877]" />
              <Avatar user={u} size={26} />
              <span className="min-w-0"><span className="block truncate text-sm">{u.name}</span>{u.title && <span className="block truncate text-xs text-mute">{u.title}</span>}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="md:col-span-2"><SubmitButton>{project ? "Save project" : "Create project"}</SubmitButton></div>
    </form>
  );
}
