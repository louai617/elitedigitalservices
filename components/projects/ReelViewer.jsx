"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Pause, Play, Volume2, VolumeX, X } from "lucide-react";

/**
 * Full-screen vertical feed for phones, like Reels: swipe up/down between
 * videos, the one in view plays, tap to pause, a button for sound.
 *
 * Only the video in view and its neighbours get a <video> element; the rest
 * are posters, so a long list stays light on a phone's memory and data.
 * Landscape videos sit centred over a blurred copy of their poster.
 */
export default function ReelViewer({ videos, startIndex = 0, client, onClose }) {
  const feedRef = useRef(null);
  const videoRefs = useRef([]);
  const [active, setActive] = useState(startIndex);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hintShown, setHintShown] = useState(true);

  // Open at the video that was tapped.
  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = startIndex * feed.clientHeight;
  }, [startIndex]);

  // Lock the page behind, and let the phone's back gesture close the viewer
  // instead of leaving the page. `onClose` must be stable (useCallback).
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    // Every way out goes through history.back(), so the entry pushed here
    // never lingers; the popstate below does the actual closing.
    const onKey = (e) => e.key === "Escape" && window.history.back();
    window.addEventListener("keydown", onKey);
    window.history.pushState({ reel: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [onClose]);

  const onScroll = () => {
    const feed = feedRef.current;
    if (!feed?.clientHeight) return;
    const i = Math.round(feed.scrollTop / feed.clientHeight);
    if (i !== active) {
      setActive(i);
      setHintShown(false);
    }
  };

  // Play the video in view, pause the others. Browsers may refuse sound
  // without a tap on that exact video; fall back to muted rather than
  // showing a frozen frame.
  useEffect(() => {
    setProgress(0);
    setPaused(false);
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i !== active) {
        v.pause();
        return;
      }
      v.currentTime = 0;
      v.muted = muted;
      v.play().catch(() => {
        v.muted = true;
        setMuted(true);
        v.play().catch(() => setPaused(true));
      });
    });
    // `muted` deliberately left out: toggling sound must not restart the video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const togglePlay = () => {
    const v = videoRefs.current[active];
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const toggleMute = () => {
    const v = videoRefs.current[active];
    const next = !muted;
    setMuted(next);
    if (v) {
      v.muted = next;
      if (v.paused) v.play().catch(() => {});
    }
  };

  const setRef = useCallback((i) => (el) => (videoRefs.current[i] = el), []);

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black text-white" role="dialog" aria-modal="true" aria-label={`${client} videos`}>
      <div
        ref={feedRef}
        onScroll={onScroll}
        className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((video, i) => {
          const near = Math.abs(i - active) <= 1;
          return (
            <section key={video.src} className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden" aria-label={video.title}>
              {/* Blurred fill behind landscape videos */}
              {video.poster && (
                <img src={video.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
              )}

              {near ? (
                <video
                  ref={setRef(i)}
                  poster={video.poster}
                  playsInline
                  loop
                  preload={i === active ? "auto" : "metadata"}
                  onClick={togglePlay}
                  onTimeUpdate={(e) => i === active && setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
                  className="relative h-full w-full object-contain"
                >
                  {[video.src, ...(video.fallbacks || [])].map((src) => (
                    <source key={src} src={src} type="video/mp4" />
                  ))}
                </video>
              ) : (
                video.poster && <img src={video.poster} alt="" className="relative h-full w-full object-contain" />
              )}

              {/* Tap-to-play indicator */}
              {i === active && paused && (
                <button type="button" onClick={togglePlay} aria-label="Play" className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                  <Play size={34} className="ml-1 fill-current" />
                </button>
              )}

              {/* Caption */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{client}</p>
                <p className="mt-1.5 text-2xl font-bold">{video.title}</p>
                <p className="mt-1 text-sm text-white/60">
                  {i + 1} / {videos.length}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      {/* Progress of the video in view */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-white/15">
        <div className="h-full bg-primary transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={() => window.history.back()} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur">
          <X size={22} />
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={togglePlay} aria-label={paused ? "Play" : "Pause"} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur">
            {paused ? <Play size={20} className="ml-0.5 fill-current" /> : <Pause size={20} className="fill-current" />}
          </button>
          <button type="button" onClick={toggleMute} aria-label={muted ? "Turn sound on" : "Mute"} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur">
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* First-open hint */}
      {hintShown && active < videos.length - 1 && (
        <div className="pointer-events-none absolute bottom-28 right-5 flex flex-col items-center text-xs text-white/70 animate-bounce">
          <ChevronDown size={22} className="rotate-180" />
          Swipe
        </div>
      )}
    </div>,
    document.body
  );
}
