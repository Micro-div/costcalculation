"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader } from "./Loader";

const MIN_DISPLAY_TIME = 2000;
const FADE_OUT_DURATION = 600;

export function LoadingWrapper({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), MIN_DISPLAY_TIME);
    const doneTimer = setTimeout(
      () => setLoading(false),
      MIN_DISPLAY_TIME + FADE_OUT_DURATION,
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
