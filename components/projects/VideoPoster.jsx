"use client";

import { useState } from "react";

/**
 * A still for a video: its poster image if there is one, otherwise the
 * video's own opening frame.
 *
 * Falls back to the frame if the poster fails to load, so a missing image
 * never shows as a broken icon.
 */
export default function VideoPoster({ video, className = "" }) {
  const [posterFailed, setPosterFailed] = useState(false);

  if (video.poster && !posterFailed) {
    return (
      <img
        src={video.poster}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setPosterFailed(true)}
        className={className}
      />
    );
  }

  // `#t=0.1` makes Safari paint a frame without a poster.
  return (
    <video
      src={`${video.fallbacks?.at(-1) || video.src}#t=0.1`}
      preload="metadata"
      muted
      playsInline
      tabIndex={-1}
      aria-hidden="true"
      className={`${className} pointer-events-none`}
    />
  );
}
