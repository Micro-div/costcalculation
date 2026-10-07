"use client";

import { ThreeDot } from "react-loading-indicators";

export function GeneratingOverlay({ showing }: { showing: boolean }) {
  return (
    <div
      className={`generating-overlay${showing ? " generating-overlay--visible" : ""}`}
      aria-hidden={!showing}
    >
      <div className="generating-content">
        <ThreeDot color="#3432ff" size="medium" text="" textColor="" />
      </div>
    </div>
  );
}
