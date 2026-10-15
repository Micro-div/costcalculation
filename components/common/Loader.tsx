"use client";

import { useEffect, useState } from "react";

/* ============================================================
   Loader
   - Laptop / desktop (pointer: fine): the classic CostCalc
     progress loader that counts 0 → 100%.
   - Mobile / tablet: the animated book loader.
   The two are shown/hidden purely with CSS so there is no
   hydration flash when switching between them.
   ============================================================ */

// Progress runs just under the 2.5s total; the remaining ~400ms is the
// fade-out handled by LoadingWrapper, so the full load feels like 2.5s.
const PROGRESS_TOTAL_MS = 2100;

function progressInfo(frac: number) {
  const pct = Math.round(frac * 100);
  let status: string;
  if (frac < 0.4) status = "Loading pricing data...";
  else if (frac < 0.85) status = "Preparing estimator...";
  else status = "Ready";
  return { pct, status };
}

// Page shape used by the animated book loader.
const PAGE_PATH =
  "M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.9684641,57.0359257 71.6643757,56.9512817 L71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1745166 72.9684641,33.0899613 71.6643757,33.0053177 L71.5,33 Z";

/* Laptop / desktop: 0 → 100% progress loader with the CostCalc wordmark. */
function ProgressLoader() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only run the counter on laptop/desktop; mobile skips this loader.
    if (!window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches) {
      return;
    }
    const start = performance.now();
    const interval = 40; // smooth bar/percentage motion
    const tid = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const frac = Math.min(elapsed / PROGRESS_TOTAL_MS, 1);
      setTick(frac);
      if (frac >= 1) window.clearInterval(tid);
    }, interval);
    return () => window.clearInterval(tid);
  }, []);

  const { pct, status } = progressInfo(tick);

  return (
    <div
      className="loader-overlay loader-laptop-only"
      role="status"
      aria-live="polite"
      aria-label="Loading CostCalc"
    >
      <div className="loader-stack">
        {/* Wordmark */}
        <div className="loader-wordmark">
          <span className="loader-wordmark-cost">Cost</span>
          <span className="loader-wordmark-calc">Calc</span>
        </div>

        {/* Progress line */}
        <div className="loader-progress">
          <div
            className="loader-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className="loader-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Percentage */}
        <div className="loader-percentage">{String(pct).padStart(2, "0")}%</div>

        {/* Status */}
        <div className="loader-status">{status}</div>
      </div>
    </div>
  );
}

/* Mobile / tablet: animated book loader. */
function BookLoader() {
  return (
    <div
      className="loader-overlay loader-mobile-only"
      role="status"
      aria-live="polite"
      aria-label="Loading CostCalc"
    >
      {/* Animated book loader (all devices). From Uiverse.io by Nawsome. */}
      <div className="book-loader">
        <div>
          <ul>
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i}>
                <svg fill="currentColor" viewBox="0 0 90 120" aria-hidden="true">
                  <path d={PAGE_PATH} />
                </svg>
              </li>
            ))}
          </ul>
        </div>
        <span>Loading</span>
      </div>
    </div>
  );
}

export function Loader() {
  return (
    <>
      <ProgressLoader />
      <BookLoader />
    </>
  );
}
