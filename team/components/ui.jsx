import Link from "next/link";

const TONES = {
  slate: "bg-white/5 text-mute ring-white/10",
  blue: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  gold: "bg-gold/10 text-gold ring-gold/25",
  violet: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
  green: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  red: "bg-red-400/10 text-red-300 ring-red-400/20",
};

export function Badge({ tone = "slate", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Badge for any {label, tone} map entry, e.g. <StatusBadge map={TASK_STATUS} value="DONE" />. */
export function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, tone: "slate" };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = "", bodyClass = "p-5" }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-mute">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute/70">{hint}</span>}
    </label>
  );
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <Icon size={22} />
        </div>
      )}
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-mute">{children}</div>}
    </div>
  );
}

export function Avatar({ user, size = 28 }) {
  const initials = (user?.name || "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      title={user?.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink ring-2 ring-panel"
      style={{ width: size, height: size, fontSize: size * 0.38, background: user?.color || "#EAB877" }}
    >
      {initials}
    </span>
  );
}

export function Stat({ label, value, href, icon: Icon }) {
  const body = (
    <div className="card flex items-center gap-4 p-5 transition hover:border-gold/40">
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold">
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs uppercase tracking-wider text-mute">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Notice({ tone = "red", children }) {
  if (!children) return null;
  const c = tone === "green" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200";
  return <p className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</p>;
}
