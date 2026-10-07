"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/common/Icon";
import { Brand } from "./Brand";
import type { EstimateItem, EstimateResult } from "@/types";

interface HistoryEntry {
  id: string;
  type: "estimate" | "draft";
  title: string;
  savedAt: string;
  data:
    | EstimateResult
    | { items: EstimateItem[]; businessName: string; customerName: string };
}

interface HeaderProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onEstimateClick: () => void;
  history: HistoryEntry[];
  onLoadHistory: (entry: HistoryEntry) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

// Mobile-only logo size (screens under 640px). Change 0.75 to resize:
// 0.65 = smaller, 0.85 = bigger. Tablet and desktop are not affected.
const headerCss = `
@media (max-width: 639px) {
  .header-logo { zoom: 0.75; }
}
`;

// Shared look for the "Estimate my project" button (desktop + mobile menu).
const estimateBtn =
  "group flex items-center gap-2 rounded-xl bg-[#313131] px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5b5b5c] active:scale-[0.98]";

export function Header({
  mobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onEstimateClick,
  history,
  onLoadHistory,
  onDeleteHistory,
  onClearHistory,
}: HeaderProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!historyOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [historyOpen]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <header
      className={`relative z-50 border-b border-[#e9e7ed]/90 bg-white/90 ${historyOpen ? "" : "backdrop-blur-xl"}`}
    >
      <style>{headerCss}</style>
      <nav
        className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-7"
        aria-label="Main navigation"
      >
        <div
          onClick={(e) => {
            if (window.location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              onCloseMobileMenu();
            }
          }}
          className="inline-block origin-left cursor-pointer transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.07] active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          <span className="header-logo block">
            <Brand />
          </span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#services"
            className="inline-flex min-h-[44px] items-center whitespace-nowrap text-sm font-medium text-[#65616d] transition hover:text-[#d67d07]"
          >
            Services
          </a>
          <a
            href="#how-it-works"
            className="inline-flex min-h-[44px] items-center whitespace-nowrap text-sm font-medium text-[#65616d] transition hover:text-[#d67d07]"
          >
            How it works
          </a>
          <a
            href="#why-costcalc"
            className="inline-flex min-h-[44px] items-center whitespace-nowrap text-sm font-medium text-[#65616d] transition hover:text-[#d67d07]"
          >
            Why CostCalc
          </a>
          <div className="relative" ref={historyRef}>
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap text-sm font-medium text-[#65616d] transition hover:text-[#d67d07]"
              aria-expanded={historyOpen}
              aria-label="Saved estimates and drafts"
            >
              <Icon name="clock" className="h-4 w-4" />
              History
              {history.length > 0 && (
                <span className="ml-0.5 rounded-full bg-[#6754e7] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {history.length}
                </span>
              )}
            </button>
            {historyOpen && (
              <>
                <div
                  className="fixed inset-0 z-[60] bg-[#0a0a0f]/70"
                  onClick={() => setHistoryOpen(false)}
                />
                <div className="fixed left-1/2 top-1/2 z-[70] w-[600px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#e8e5ed] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between border-b border-[#f0eef3] px-6 py-4">
                    <p className="text-base font-bold text-[#2b2732]">
                      History
                    </p>
                    <div className="flex items-center gap-3">
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={onClearHistory}
                          className="text-xs font-medium text-[#9a95a0] transition hover:text-[#6754e7]"
                        >
                          Clear all
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(false)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#9a95a0] transition hover:bg-[#f5f4f7] hover:text-[#3a3641]"
                        aria-label="Close history"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="px-6 py-12 text-center text-sm text-[#9a95a0]">
                        No saved estimates or drafts yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#f4f2f6]">
                        {history.map((entry) => (
                          <li key={entry.id} className="group relative">
                            <button
                              type="button"
                              onClick={() => {
                                onLoadHistory(entry);
                                setHistoryOpen(false);
                              }}
                              className="w-full px-6 py-4 text-left transition hover:bg-[#f8f7fa]"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                    entry.type === "estimate"
                                      ? "bg-[#e9f8f0] text-[#198454]"
                                      : "bg-[#fff4e0] text-[#9a681c]"
                                  }`}
                                >
                                  {entry.type}
                                </span>
                                <p className="truncate text-sm font-semibold text-[#3a3641]">
                                  {entry.title}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-[#9a95a0]">
                                {formatDate(entry.savedAt)}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHistory(entry.id);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#c5c1cc] opacity-0 transition hover:bg-[#f5f4f7] hover:text-[#6754e7] group-hover:opacity-100"
                              aria-label="Delete entry"
                            >
                              <Icon name="close" className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEstimateClick}
            aria-label="New estimate"
            className="group flex min-h-[44px] items-center gap-2 rounded-full bg-[#EEEDF3] px-4 py-2 text-sm font-semibold text-[#2b2732] transition hover:bg-[#e3e1ea]"
          >
            <Icon name="plus" className="h-4 w-4" />
            <span className="hidden whitespace-nowrap md:inline">New estimate</span>
          </button>
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#e5e2e9] text-[#393541] md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} />
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="border-t border-[#ece9ef] bg-white px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1">
            {[
              ["Services", "services"],
              ["How it works", "how-it-works"],
              ["Why CostCalc", "why-costcalc"],
            ].map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={onCloseMobileMenu}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-[#4c4854] transition hover:bg-[#f6f5f8] hover:text-[#d67d07]"
              >
                {label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                onCloseMobileMenu();
                setHistoryOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#4c4854] hover:bg-[#f6f5f8]"
            >
              <Icon name="clock" className="h-4 w-4" />
              History
              {history.length > 0 && (
                <span className="rounded-full bg-[#6754e7] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {history.length}
                </span>
              )}
            </button>
            {historyOpen && (
              <>
                <div
                  className="fixed inset-0 z-[60] bg-[#0a0a0f]/70"
                  onClick={() => setHistoryOpen(false)}
                />
                <div className="fixed left-1/2 top-1/2 z-[70] w-[600px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#e8e5ed] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between border-b border-[#f0eef3] px-4 py-3">
                    <p className="text-sm font-bold text-[#2b2732]">History</p>
                    <div className="flex items-center gap-3">
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={onClearHistory}
                          className="text-xs font-medium text-[#9a95a0] transition hover:text-[#6754e7]"
                        >
                          Clear all
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(false)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#9a95a0] transition hover:bg-[#f5f4f7]"
                        aria-label="Close history"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-[#9a95a0]">
                        No saved estimates or drafts yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#f4f2f6]">
                        {history.map((entry) => (
                          <li key={entry.id} className="group relative">
                            <button
                              type="button"
                              onClick={() => {
                                onLoadHistory(entry);
                                setHistoryOpen(false);
                                onCloseMobileMenu();
                              }}
                              className="w-full px-6 py-4 text-left transition hover:bg-[#f8f7fa]"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                    entry.type === "estimate"
                                      ? "bg-[#e9f8f0] text-[#198454]"
                                      : "bg-[#fff4e0] text-[#9a681c]"
                                  }`}
                                >
                                  {entry.type}
                                </span>
                                <p className="truncate text-sm font-semibold text-[#3a3641]">
                                  {entry.title}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-[#9a95a0]">
                                {formatDate(entry.savedAt)}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHistory(entry.id);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#c5c1cc] opacity-0 transition hover:bg-[#f5f4f7] hover:text-[#6754e7] group-hover:opacity-100"
                              aria-label="Delete entry"
                            >
                              <Icon name="close" className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                onCloseMobileMenu();
                onEstimateClick();
              }}
              className={`${estimateBtn} mt-2 justify-center`}
            >
              Estimate my project
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/plus.png"
                alt=""
                className="h-4 w-4 brightness-0 invert transition-transform duration-300 group-hover:rotate-90"
              />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}