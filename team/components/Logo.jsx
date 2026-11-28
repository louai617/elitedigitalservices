// Each copy needs its own gradient id: if two shared one and the first sat in
// a hidden element (e.g. the phone header on desktop), the visible copy would
// reference a gradient that never renders and draw nothing.
export function LogoMark({ className = "h-8 w-8", gid = "ems-gold" }) {
  return (
    <svg viewBox="335 335 1330 1330" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#D6A46A" />
          <stop offset="1" stopColor="#FFCC87" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gid})`}>
        <path d="M335 335H760V461H461V760H335Z" />
        <path d="M1665 335V760H1539V461H1240V335Z" />
        <path d="M335 1665V1240H461V1539H760V1665Z" />
        <path d="M1665 1665H1240V1539H1539V1240H1665Z" />
        <circle cx="1000" cy="1000" r="126.5" />
      </g>
    </svg>
  );
}

export function Brand({ gid = "ems-gold-brand", label = "TEAM SPACE" }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark gid={gid} />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-[0.2em]">ELITE</span>
        <span className="mt-1 bg-gradient-to-r from-gold-deep to-gold-light bg-clip-text text-[0.55rem] font-medium tracking-[0.3em] text-transparent">
          {label}
        </span>
      </span>
    </span>
  );
}
