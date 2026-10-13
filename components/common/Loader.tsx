"use client";

import { useEffect, useState } from "react";

const TOTAL_MS = 2600; // matches LoadingWrapper display window (2000 + 600)

function progressInfo(frac: number) {
  const pct = Math.round(frac * 100);
  let status: string;
  if (frac < 0.4) status = "Loading pricing data...";
  else if (frac < 0.85) status = "Preparing estimator...";
  else status = "Ready";
  return { pct, status };
}

export function Loader() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const start = typeof performance !== "undefined" ? performance.now() : 0;
    const interval = 50; // 50ms ticks for smooth bar/percentage motion
    const tid = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const frac = Math.min(elapsed / TOTAL_MS, 1);
      setTick(frac);
      if (frac >= 1) window.clearInterval(tid);
    }, interval);
    return () => window.clearInterval(tid);
  }, []);

  const { pct, status } = progressInfo(tick);

  return (
    <div className="loader-overlay" role="status" aria-live="polite" aria-label="Loading CostCalc">
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
