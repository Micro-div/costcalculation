"use client";

import { useEffect, useRef, useState } from "react";

interface BannerVideoProps {
  mobileSrc: string;
  desktopSrc: string;
  poster: string;
  ariaLabel: string;
}

/**
 * Loads exactly ONE banner video for the current device (never both).
 * `preload="none"` plus the poster image keeps the first paint light; the
 * video data is only requested once the banner scrolls into view, and it is
 * never played when the user prefers reduced motion.
 */
export function BannerVideo({
  mobileSrc,
  desktopSrc,
  poster,
  ariaLabel,
}: BannerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const apply = () => setSrc(query.matches ? desktopSrc : mobileSrc);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [mobileSrc, desktopSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      video.preload = "auto";
      void video.play().catch(() => {});
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        video.preload = "auto";
        video.load();
        void video.play().catch(() => {});
        observer.disconnect();
      },
      { threshold: 0.4 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src ?? undefined}
      poster={poster}
      muted
      playsInline
      preload="none"
      aria-label={ariaLabel}
      className="block aspect-[1080/800] h-auto w-full object-cover sm:aspect-[1980/500]"
    />
  );
}
