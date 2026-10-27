"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader } from "./Loader";

// The page mounts after 2s. The fade starts early enough that the loader is
// completely gone by then, so the hero heading and estimator entrance
// animations both begin at the same moment. The loader mounts once per full
// page load and is removed afterwards, so it never flashes a second time.
const MIN_DISPLAY_TIME = 2000;
const FADE_OUT_DURATION = 500;

export function LoadingWrapper({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(
      () => setFading(true),
      Math.max(0, MIN_DISPLAY_TIME - FADE_OUT_DURATION),
    );
    const doneTimer = window.setTimeout(
      () => setLoading(false),
      MIN_DISPLAY_TIME,
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  return (
    <>
      {loading && (
        <div
          className={
            fading
              ? "loader-fade-wrapper loader-fade-wrapper--fading"
              : "loader-fade-wrapper"
          }
        >
          <Loader />
        </div>
      )}
      {!loading && children}
    </>
  );
}
