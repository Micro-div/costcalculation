"use client";

export function Loader() {
  return (
    <div className="loader-overlay" role="status" aria-live="polite" aria-label="Loading CostCalc">
      <div className="loader">
        <p>loading</p>
        <div className="loader-words">
          <span className="loader-word">buttons</span>
          <span className="loader-word">forms</span>
          <span className="loader-word">switches</span>
          <span className="loader-word">cards</span>
          <span className="loader-word">buttons</span>
        </div>
      </div>
    </div>
  );
}
