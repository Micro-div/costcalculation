"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader } from "./Loader";
import { markAppReady } from "@/lib/appReady";

// Total loader time stays between 1 and 2 seconds on every device.
const MOBILE_MIN_DISPLAY_TIME = 1000; // mobile/tablet: 1000 + 400 = 1400ms
const MOBILE_FADE_OUT_DURATION = 400;
const DESKTOP_MIN_DISPLAY_TIME = 2100; // laptop/desktop: 2100 + 400 = 2500ms (2.5s)
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

  // Prevent the page from scrolling underneath the loader while it's visible.
  useEffect(() => {
    if (!loading) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [loading]);

  // The site is painted behind the loader, so its entrance animations would
  // otherwise finish before it's revealed. Keep them paused while the loader
  // is up, then release them as the loader starts fading — so the heading,
  // estimator card and sections animate in right when the website appears.
  useEffect(() => {
    const root = document.documentElement;
    if (fading || !loading) {
      root.classList.remove("app-loading");
      markAppReady();
    } else {
      root.classList.add("app-loading");
    }
  }, [loading, fading]);

  return (
    <>
      {/*
        Render the site immediately and cover it with the loader overlay.
        This way, when the loader fades out there is always content painted
        underneath — no blank/white flash between the loader and the page.
      */}
      {children}
      {loading && (
        <div className={fading ? "loader-fade-wrapper loader-fade-wrapper--fading" : "loader-fade-wrapper"}>
          <Loader />
        </div>
      )}
    </>
  );
}
