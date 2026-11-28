import { Check } from "lucide-react";

// What a client sees as the stages of their project.
const STEPS = [
  { key: "PLANNING", label: "Planning" },
  { key: "IN_PROGRESS", label: "In production" },
  { key: "REVIEW", label: "Review" },
  { key: "DELIVERED", label: "Delivered" },
];
const INDEX = { LEAD: 0, PLANNING: 0, IN_PROGRESS: 1, REVIEW: 2, DELIVERED: 3, ON_HOLD: -1 };

export default function ProjectStepper({ status }) {
  const current = INDEX[status] ?? 0;
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((s, i) => {
        const done = current > i || status === "DELIVERED";
        const active = current === i && status !== "DELIVERED";
        return (
          <li key={s.key} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done || active ? "bg-gold" : "bg-line"}`} />
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-gold text-ink" : active ? "bg-gold/15 text-gold ring-2 ring-gold" : "bg-white/5 text-mute"
              }`}>
                {done ? <Check size={15} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "opacity-0" : done ? "bg-gold" : "bg-line"}`} />
            </div>
            <span className={`mt-2 text-xs sm:text-sm ${active ? "font-semibold text-gold" : done ? "text-bone" : "text-mute"}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
