"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  Play,
  Sparkles,
  Smartphone,
  Stethoscope,
  MonitorPlay,
} from "lucide-react";
import VideoPoster from "./VideoPoster";

const ICONS = { Clapperboard, Film, Sparkles, Smartphone, Stethoscope, MonitorPlay };
const pad = (n) => String(n).padStart(2, "0");

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

/** Full page body for a video project: hero, one player + grid per client, services, CTA. */
export default function VideoShowcase({ project }) {
  const groups = project.videoGroups || [];
  const total = groups.reduce((n, g) => n + g.videos.length, 0);
  const cover = project.project?.banner;

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <header className="relative isolate overflow-hidden">
        {cover && (
          <img
            src={cover}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20 sm:opacity-40 scale-105"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />

        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Clapperboard size={14} />
              {project.service.split("-").join(" ")} · {project.year}
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
              {project.title}
              <span className="text-primary">.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {project.tagline || project.description}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#work"
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-[0_0_40px_-8px] shadow-primary/60 transition hover:brightness-110"
              >
                <Play size={18} className="fill-current" />
                Watch the work
              </a>
              <Link
                href="/#contact"
                className="group inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 font-semibold transition hover:border-primary hover:text-primary"
              >
                Start a project
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 grid max-w-2xl grid-cols-3 divide-x divide-border/60 rounded-2xl border border-border/60 bg-card/40 backdrop-blur"
          >
            {[
              [total, total === 1 ? "Film" : "Films"],
              [groups.length, groups.length === 1 ? "Client" : "Clients"],
              ["HD", "1080p delivery"],
            ].map(([value, label]) => (
              <div key={label} className="px-4 py-5 text-center sm:px-6">
                <dt className="sr-only">{label}</dt>
                <dd className="text-3xl font-bold text-foreground sm:text-4xl">{value}</dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </header>

      {/* ---------------------------------------------------- the work */}
      <div id="work" className="scroll-mt-20">
        {groups.map((group) => (
          <ClientReel key={group.title} group={group} />
        ))}
      </div>

      {/* ---------------------------------------------------- services */}
      {project.highlights?.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <motion.div {...fadeUp} className="mb-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">What we film</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Content that builds trust before the first visit.</h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {project.highlights.map((h, i) => {
              const Icon = ICONS[h.icon] || Film;
              return (
                <motion.div
                  key={h.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="group rounded-2xl border border-border/60 bg-card/40 p-6 transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.text}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-6xl px-4 pt-4 pb-8">
        <motion.div
          {...fadeUp}
          className="relative isolate overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-background px-6 py-14 text-center sm:px-16 sm:py-20"
        >
          <div className="absolute -bottom-32 left-1/2 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
          <h2 className="text-3xl font-bold sm:text-5xl">
            {project.ctaTitle || "Your story, on camera."}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            From scripting to final cut — we plan, shoot and edit videos that turn viewers into patients.
          </p>
          <Link
            href="/#contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Book a shoot
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>
    </>
  );
}

/** One client: a large player with ambient glow, then every video as a card. */
function ClientReel({ group }) {
  const { videos } = group;
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const current = videos[index];

  const select = useCallback(
    (i, { scroll = false } = {}) => {
      setIndex((i + videos.length) % videos.length);
      setAutoplay(true);
      if (scroll) stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [videos.length]
  );

  // The player is remounted per video (key below); start it when the
  // visitor picked it, not on first page load.
  useEffect(() => {
    if (autoplay) videoRef.current?.play().catch(() => {});
  }, [index, autoplay]);

  const onKeyDown = (e) => {
    if (e.target.tagName === "VIDEO" && e.key.startsWith("Arrow")) return; // let the player seek
    if (e.key === "ArrowLeft") select(index - 1);
    if (e.key === "ArrowRight") select(index + 1);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-label={`${group.title} videos`} onKeyDown={onKeyDown}>
      <motion.div {...fadeUp} className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Client</p>
          <h2 className="mt-2 text-4xl font-bold uppercase tracking-[0.12em] text-primary sm:text-5xl">{group.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {videos.length} {videos.length === 1 ? "film" : "films"}
        </p>
      </motion.div>

      {/* Stage */}
      <motion.div {...fadeUp} ref={stageRef} className="relative scroll-mt-24">
        {/* Ambient glow: the current poster, blurred behind the frame. */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-6 -z-10 opacity-50 blur-3xl sm:-inset-10">
          <VideoPoster key={current.src} video={current} className="h-full w-full object-cover" />
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-primary/20 sm:rounded-3xl">
          <div className="aspect-video">
            <video
              key={current.src}
              ref={videoRef}
              title={current.title}
              poster={current.poster}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
            >
              {/* Tried in order: the copy on this server, then each fallback. */}
              {[current.src, ...(current.fallbacks || [])].map((src) => (
                <source key={src} src={src} type="video/mp4" />
              ))}
            </video>
          </div>
        </div>

        {videos.length > 1 && (
          <>
            <StageArrow side="left" onClick={() => select(index - 1)} />
            <StageArrow side="right" onClick={() => select(index + 1)} />
          </>
        )}
      </motion.div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-primary">Now playing</p>
          <p className="truncate text-xl font-semibold sm:text-2xl" aria-live="polite">{current.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="font-mono text-sm tabular-nums text-muted-foreground">
            <span className="text-foreground">{pad(index + 1)}</span> / {pad(videos.length)}
          </p>
          {videos.length > 1 && (
            <div className="flex gap-2 sm:hidden">
              <button type="button" onClick={() => select(index - 1)} aria-label="Previous video" className="flex h-10 w-10 items-center justify-center rounded-full border border-border active:bg-primary active:text-primary-foreground">
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={() => select(index + 1)} aria-label="Next video" className="flex h-10 w-10 items-center justify-center rounded-full border border-border active:bg-primary active:text-primary-foreground">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {videos.length > 1 && (
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {videos.map((video, i) => {
            const active = i === index;
            return (
              <motion.li
                key={video.src}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
              >
                <button
                  type="button"
                  onClick={() => select(i, { scroll: true })}
                  aria-label={`Play ${video.title}`}
                  aria-current={active}
                  className={`group relative block w-full overflow-hidden rounded-xl text-left ring-1 transition duration-300 ${
                    active ? "ring-2 ring-primary" : "ring-border/60 hover:ring-primary/50"
                  }`}
                >
                  <div className="relative aspect-video bg-muted">
                    <VideoPoster
                      video={video}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="absolute left-3 top-3 font-mono text-xs text-white/70">{pad(i + 1)}</span>

                    {active ? (
                      <span className="absolute right-3 top-3 flex items-end gap-[3px] rounded-full bg-primary px-2 py-1.5" aria-hidden="true">
                        {[0, 1, 2].map((b) => (
                          <span
                            key={b}
                            className="w-[3px] origin-bottom rounded-full bg-primary-foreground animate-[eq_0.9s_ease-in-out_infinite]"
                            style={{ height: 10, animationDelay: `${b * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                        <Play size={18} className="ml-0.5 fill-current" />
                      </span>
                    )}

                    <span className="absolute inset-x-3 bottom-2.5 truncate text-sm font-medium text-white">
                      {video.title}
                    </span>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StageArrow({ side, onClick }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous video" : "Next video"}
      className={`absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-lg backdrop-blur transition hover:border-primary hover:bg-primary hover:text-primary-foreground sm:flex ${
        side === "left" ? "-left-6" : "-right-6"
      }`}
    >
      <Icon size={22} />
    </button>
  );
}
