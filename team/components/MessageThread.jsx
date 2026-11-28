import { Avatar } from "./ui";
import { SubmitButton } from "./client-ui";
import { fmtDateTime } from "@/lib/format";

/**
 * The client ↔ team conversation on a project. Used on both sides; `action`
 * is the side's own server action. Client messages are marked so the team
 * can tell them apart at a glance.
 */
export default function MessageThread({ messages, action, projectId, meId, placeholder = "Write a message…", emptyText }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && <p className="text-sm text-mute">{emptyText}</p>}
      {messages.map((m) => {
        const mine = m.author.id === meId;
        const fromClient = m.author.role === "CLIENT";
        return (
          <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse text-right" : ""}`}>
            <Avatar user={m.author} size={30} />
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? "bg-gold/10" : "bg-white/[0.04]"}`}>
              <p className="text-xs text-mute">
                <span className="font-medium text-bone">{m.author.name}</span>
                {fromClient && <span className="ml-1.5 rounded-full bg-sky-400/10 px-1.5 text-[10px] text-sky-300">Client</span>}
                {" · "}{fmtDateTime(m.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-left text-sm">{m.body}</p>
            </div>
          </div>
        );
      })}
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="projectId" value={projectId} />
        <textarea name="body" required rows={2} placeholder={placeholder} className="input flex-1" />
        <SubmitButton className="btn btn-primary sm:self-end">Send</SubmitButton>
      </form>
    </div>
  );
}
