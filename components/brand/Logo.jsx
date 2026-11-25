/**
 * The EMS mark (gold-gradient viewfinder) as inline SVG, so it stays sharp at
 * every size and needs no request. Same geometry as public/ems-logo.svg.
 *
 * <LogoMark />           the mark alone
 * <Logo />               mark + "ELITE / MEDIA SOLUTIONS" wordmark
 */
export function LogoMark({ className = "h-8 w-8", title }) {
  return (
    <svg
      viewBox="335 335 1330 1330"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* Identical wherever it is repeated, so duplicate ids are harmless. */}
        <linearGradient id="ems-gold" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#D6A46A" />
          <stop offset="1" stopColor="#FFCC87" />
        </linearGradient>
      </defs>
      <g fill="url(#ems-gold)">
        <path d="M335 335H760V461H461V760H335Z" />
        <path d="M1665 335V760H1539V461H1240V335Z" />
        <path d="M335 1665V1240H461V1539H760V1665Z" />
        <path d="M1665 1665H1240V1539H1539V1240H1665Z" />
        <circle cx="1000" cy="1000" r="126.5" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = "sm", className = "" }) {
  const big = size === "lg";
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span
        className={`font-semibold text-[#F6F4F0] ${
          big ? "text-3xl sm:text-4xl md:text-5xl tracking-[0.18em]" : "text-base tracking-[0.2em]"
        }`}
      >
        ELITE
      </span>
      <span
        className={`bg-gradient-to-r from-[#D6A46A] to-[#FFCC87] bg-clip-text font-medium text-transparent ${
          big ? "mt-1.5 text-[0.65rem] sm:text-xs md:text-sm tracking-[0.42em]" : "mt-1 text-[0.5rem] tracking-[0.34em]"
        }`}
      >
        MEDIA SOLUTIONS
      </span>
    </span>
  );
}

export default function Logo({ className = "", markClassName = "h-8 w-8" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <Wordmark />
    </span>
  );
}
