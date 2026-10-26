"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { useModalA11y } from "@/lib/useModalA11y";
import { LogoMagnet } from "./LogoMagnet";
import { MenuToggle } from "./MenuToggle";
import type { HistoryEntry } from "@/types";

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

// Simple "New estimate" as plain text (orange on hover, like other nav links).
const estimateBtn =
  "group flex items-center gap-2 text-sm font-semibold text-[#4c4854] transition-colors hover:text-[#ea580c]";

// Count badge: light grey, a touch darker on hover.
const historyBadge =
  "rounded-full bg-[#efedf3] px-1.5 py-0.5 text-[10px] font-bold text-[#6a6579] transition-colors hover:bg-[#e1dee9]";

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
  const [historyClosing, setHistoryClosing] = useState(false);
  const historyDialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // History ko page ke bilkul beech (fixed center) modal ki tarah dikhao.
  // Khali history hone par bhi panel khule (empty state dikhay).
  const closeHistory = useCallback(() => {
    setHistoryClosing(true);
    window.setTimeout(() => {
      setHistoryOpen(false);
      setHistoryClosing(false);
    }, 200);
  }, []);

  useModalA11y(historyDialogRef, closeHistory, undefined, historyOpen);

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
    <>
      <header className="sticky top-0 z-50 border-b border-[#e9e7ed]/90 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <nav
          className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-7"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            aria-label="CostCalc home"
            onClick={(e) => {
              onCloseMobileMenu();
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="brand-link inline-flex items-center leading-none"
          >
            <LogoMagnet />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#services"
              className="whitespace-nowrap text-sm font-medium text-[#4c4854] transition-colors hover:text-[#ea580c]"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              className="whitespace-nowrap text-sm font-medium text-[#4c4854] transition-colors hover:text-[#ea580c]"
            >
              How it works
            </a>
            <a
              href="#why-costcalc"
              className="whitespace-nowrap text-sm font-medium text-[#4c4854] transition-colors hover:text-[#d36931]"
            >
              Why CostCalc
            </a>
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  historyOpen ? closeHistory() : setHistoryOpen(true)
                }
                className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-[#4c4854] transition-colors hover:text-[#ea580c]"
                aria-expanded={historyOpen}
                aria-label="Saved estimates and drafts"
              >
                <Icon name="clock" className="h-4 w-4" />
                History
                {history.length > 0 && (
                  <span className={historyBadge}>
                    {history.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEstimateClick}
              className="hidden md:flex items-center gap-2 rounded-lg border border-[#d1d5db] bg-[#f3f4f6] px-3 py-2 text-sm font-semibold text-[#4c4854] transition-all duration-200 hover:border-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#374151]"
              aria-label="New estimate"
            >
              <Icon name="plus" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              <span className="whitespace-nowrap">New estimate</span>
            </button>
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e2e9] text-[#393541] sm:h-11 sm:w-11 md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation"
            >
              <MenuToggle open={mobileMenuOpen} />
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
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-[#4c4854] transition-colors hover:text-[#ea580c]"
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
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#4c4854] transition hover:bg-[#f3f1fb] hover:text-[#6754e7]"
              >
                <Icon name="clock" className="h-4 w-4" />
                History
                {history.length > 0 && (
                  <span className={historyBadge}>{history.length}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseMobileMenu();
                  onEstimateClick();
                }}
                className="flex items-center gap-2 text-sm font-semibold text-[#4c4854] transition-colors hover:text-[#ea580c] mt-2"
              >
                Estimate my project
              </button>
            </div>
          </div>
        )}
      </header>

      {/* History modal — page ke bilkul beech (centered), bahar click se smoothly band */}
      {historyOpen && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px] ${historyClosing ? "history-backdrop--closing" : "history-backdrop"}`}
          onPointerDown={closeHistory}
        >
          <div
            ref={historyDialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="History"
            onPointerDown={(e) => e.stopPropagation()}
            className={`flex max-h-[80vh] w-[600px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#e8e5ed] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.3)] outline-none ${historyClosing ? "history-modal--closing" : "history-modal"}`}
          >
            <div className="flex items-center justify-between border-b border-[#f0eef3] px-6 py-4">
              <p className="text-base font-bold text-[#2b2732]">History</p>
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
                  onClick={closeHistory}
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
                          onCloseMobileMenu();
                          closeHistory();
                        }}
                        className="w-full px-6 py-4 text-left transition hover:bg-[#f8f7fa]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              entry.type === "estimate"
                                ? "bg-[#e9f8f0] text-[#198454]"
                                : "bg-[#fff4e0] text-[#dd8511]"
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
        </div>
      )}
    </>
  );
}
