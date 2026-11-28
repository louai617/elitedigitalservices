"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, Eye, MessageSquare } from "lucide-react";
import { moveTask } from "@/app/(app)/projects/actions";
import { PRIORITY, TASK_STATUS } from "@/lib/format";
import { Avatar, Badge } from "./ui";

const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const COL_ACCENT = { TODO: "bg-mute", IN_PROGRESS: "bg-gold", REVIEW: "bg-violet-400", DONE: "bg-emerald-400" };

/**
 * Drag cards between columns (desktop) or pick a status from the card's menu
 * (phones, where HTML drag and drop doesn't exist). Moves show instantly and
 * roll back if the server refuses.
 */
export default function KanbanBoard({ tasks, editableIds, showProject = false }) {
  const [optimistic, applyMove] = useOptimistic(tasks, (state, { id, status }) =>
    state.map((t) => (t.id === id ? { ...t, status } : t))
  );
  const [, startTransition] = useTransition();
  const [over, setOver] = useState(null);
  const [error, setError] = useState(null);

  const move = (id, status) => {
    setError(null);
    startTransition(async () => {
      applyMove({ id, status });
      try {
        await moveTask(id, status);
      } catch (e) {
        setError(e.message || "Couldn't move the task.");
      }
    });
  };

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
      <div className="scroll-thin -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {COLUMNS.map((col) => {
          const items = optimistic.filter((t) => t.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOver(col); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/task");
                if (id && optimistic.find((t) => t.id === id)?.status !== col) move(id, col);
              }}
              className={`w-[82vw] shrink-0 snap-start rounded-2xl border bg-panel/60 p-3 transition sm:w-80 lg:w-auto ${
                over === col ? "border-gold/60 bg-gold/5" : "border-line"
              }`}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2 w-2 rounded-full ${COL_ACCENT[col]}`} />
                <h3 className="text-sm font-semibold">{TASK_STATUS[col].label}</h3>
                <span className="ml-auto text-xs text-mute">{items.length}</span>
              </div>
              <div className="min-h-24 space-y-2.5">
                {items.map((t) => {
                  const editable = editableIds.includes(t.id);
                  const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
                  return (
                    <article
                      key={t.id}
                      draggable={editable}
                      onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
                      className={`group rounded-xl border border-line bg-panel-2 p-3 transition hover:border-gold/40 ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Badge tone={PRIORITY[t.priority].tone}>{PRIORITY[t.priority].label}</Badge>
                        {showProject && <span className="truncate text-xs text-mute">{t.projectName}</span>}
                        {t.clientVisible && <span title="Client sees this milestone" className="ml-auto text-gold"><Eye size={13} /></span>}
                      </div>
                      <Link href={`/tasks/${t.id}`} className="block text-sm font-medium leading-snug hover:text-gold">{t.title}</Link>
                      <div className="mt-3 flex items-center gap-3 text-xs text-mute">
                        {t.assignee ? <Avatar user={t.assignee} size={22} /> : <span className="h-[22px] w-[22px] rounded-full border border-dashed border-line" title="Unassigned" />}
                        {t.dueDate && <span className={`inline-flex items-center gap-1 ${overdue ? "text-red-300" : ""}`}><CalendarClock size={12} />{new Date(t.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                        {t.comments > 0 && <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{t.comments}</span>}
                        {editable && (
                          <select
                            aria-label="Move to"
                            value={t.status}
                            onChange={(e) => move(t.id, e.target.value)}
                            className="ml-auto rounded-md border border-line bg-ink px-1.5 py-0.5 text-xs lg:hidden"
                          >
                            {COLUMNS.map((c) => <option key={c} value={c}>{TASK_STATUS[c].label}</option>)}
                          </select>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
