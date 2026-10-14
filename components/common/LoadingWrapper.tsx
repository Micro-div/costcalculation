"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader } from "./Loader";

// Total loader time stays between 1 and 2 seconds on every device.
const MOBILE_MIN_DISPLAY_TIME = 1000; // mobile/tablet: 1000 + 400 = 1400ms
const MOBILE_FADE_OUT_DURATION = 400;
const DESKTOP_MIN_DISPLAY_TIME = 1400; // laptop/desktop: 1400 + 400 = 1800ms
const DESKTOP_FADE_OUT_DURATION = 400;

export function LoadingWrapper({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const isMobileOrTablet =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    const minDisplay = isMobileOrTablet
      ? MOBILE_MIN_DISPLAY_TIME
      : DESKTOP_MIN_DISPLAY_TIME;
    const fadeOut = isMobileOrTablet
      ? MOBILE_FADE_OUT_DURATION
      : DESKTOP_FADE_OUT_DURATION;

    const fadeTimer = setTimeout(() => setFading(true), minDisplay);
    const doneTimer = setTimeout(
      () => setLoading(false),
      minDisplay + fadeOut,
    );

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <>
      {loading && (
        <div className={fading ? "loader-fade-wrapper loader-fade-wrapper--fading" : "loader-fade-wrapper"}>
          <Loader />
        </div>
      )}
      {!loading && children}
    </>
  );
}
