"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/common/Icon";

/**
 * Shares the current page: native share sheet where available, otherwise
 * copies the URL (with a prompt fallback when the clipboard is blocked).
 */
export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const share = async () => {
    const url = window.location.origin;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "CostCalc — Project Cost Estimator",
          text: "Know what your project should cost.",
          url,
        });
      } catch {
        // The user dismissed the share sheet — nothing else to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      timerRef.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
    >
      <Icon name={copied ? "check" : "share"} className="h-4 w-4" />
      {copied ? "Link copied" : "Share CostCalc"}
    </button>
  );
}
