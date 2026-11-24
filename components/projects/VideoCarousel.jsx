"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * One video at a time, with arrows, a counter and a thumbnail strip.
 *
 * The track is a native scroll-snap container, so swiping works on phones
 * without a gesture library. Moving to another slide pauses whatever was
 * playing, so two videos never talk over each other.
 */
export default function VideoCarousel({ videos, label }) {
  const trackRef = useRef(null);
  const videoRefs = useRef([]);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (i) => {
      const track = trackRef.current;
      if (!track) return;
      const next = (i + videos.length) % videos.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    },
    [videos.length]
  );

  // Keep the active index in step with swipes and arrow scrolls alike.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  // Pause every video except the one in view.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (v && i !== index && !v.paused) v.pause();
    });
  }, [index]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl sm:rounded-3xl border border-border/50 shadow-2xl bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {videos.map((video, i) => (
            <div
              key={video.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${videos.length}: ${video.title}`}
              className="relative w-full shrink-0 snap-center aspect-video"
            >
              <video
                ref={(el) => (videoRefs.current[i] = el)}
                src={video.src}
                title={video.title}
                controls
                playsInline
                // Only the first player preloads; the rest wait until someone
                // moves to them. (Thumbnails below fetch just enough for a frame.)
                preload={i === 0 ? "metadata" : "none"}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>

        {videos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous video"
              className="absolute left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border text-foreground shadow-lg transition hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next video"
              className="absolute right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border text-foreground shadow-lg transition hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="text-lg font-medium text-foreground" aria-live="polite">
          {videos[index]?.title}
        </p>
        <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {index + 1} / {videos.length}
        </p>
      </div>

      {videos.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {videos.map((video, i) => (
            <button
              key={video.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Play ${video.title}`}
              aria-current={i === index}
              className={`group relative w-32 sm:w-40 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index
                  ? "border-primary"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <div className="relative aspect-video bg-muted">
                {/* `#t=0.1` makes Safari paint a frame without a poster. */}
                <video
                  src={`${video.src}#t=0.1`}
                  preload="metadata"
                  muted
                  playsInline
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              </div>
              <span className="block truncate px-2 py-1.5 text-left text-xs text-muted-foreground group-hover:text-foreground">
                {video.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
