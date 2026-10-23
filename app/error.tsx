"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f8fb] px-6 py-16 text-[#1d1b24]">
      <div className="w-full max-w-md rounded-3xl border border-[#e8e5ed] bg-white p-7 text-center shadow-[0_24px_70px_rgba(45,38,74,0.12)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fdf1e3] text-[#a8741a]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#77727e]">
          The estimate could not be displayed. Your data has not been changed.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#6754e7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5946d3]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
