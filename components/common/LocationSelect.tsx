"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/common/Icon";
import type { Country, Location, LocationId } from "@/types";

interface LocationSelectProps {
  countries: Country[];
  locations: Location[];
  value: LocationId;
  onChange: (id: LocationId) => void;
  /** "form" = large estimator control, "chat" = compact chat header control. */
  size?: "form" | "chat";
  className?: string;
  ariaLabel?: string;
}

interface PanelRect {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

const PANEL_MAX_HEIGHT = 320;
const PANEL_GAP = 6;
const EDGE = 8;

/**
 * A country + city picker. All countries are listed at once; tapping a country
 * smoothly expands its cities underneath it, so scanning for a country stays
 * quick. Cities never appear under a country that is not selected.
 *
 * The dropdown renders into a portal and is positioned with fixed coordinates,
 * so it works inside cards that clip their overflow (the estimator card and the
 * chat panel both use `overflow-hidden`).
 */
export function LocationSelect({
  countries,
  locations,
  value,
  onChange,
  size = "form",
  className = "",
  ariaLabel = "Location",
}: LocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);
  const [expandedCountryId, setExpandedCountryId] = useState<string>(
    () =>
      locations.find((loc) => loc.id === value)?.countryId ??
      countries[0]?.id ??
      "",
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // The auto-scroll runs once per open, after the panel has mounted.
  const didAutoScroll = useRef(false);

  const locationsByCountry = useMemo(() => {
    const map = new Map<string, Location[]>();
    for (const loc of locations) {
      const list = map.get(loc.countryId);
      if (list) list.push(loc);
      else map.set(loc.countryId, [loc]);
    }
    return map;
  }, [locations]);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === value) ?? null,
    [locations, value],
  );

  const selectedLabel = selectedLocation
    ? `${selectedLocation.city}, ${selectedLocation.country}`
    : "";

  // Keep the expanded country in sync when the selection changes from outside
  // (e.g. the chat detects a city in the user's message).
  useEffect(() => {
    const loc = locations.find((item) => item.id === value);
    if (loc) setExpandedCountryId(loc.countryId);
  }, [value, locations]);

  // Reset the one-shot auto-scroll whenever the panel closes.
  useEffect(() => {
    if (!open) didAutoScroll.current = false;
  }, [open]);

  // Position the floating panel. We only re-measure on open, on resize, and on
  // page scrolls — never on scrolls that happen inside the panel itself (that
  // previously caused a feedback loop while scrolling the city list).
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;

    let last: PanelRect | null = null;

    const measure = (): PanelRect => {
      const rect = trigger.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      // Space available on each side, minus the gap and a small edge.
      const below = vh - rect.bottom - EDGE - PANEL_GAP;
      const above = rect.top - EDGE - PANEL_GAP;
      const openUp = below < 200 && above > below;

      const maxHeight = Math.max(
        132,
        Math.min(PANEL_MAX_HEIGHT, openUp ? above : below, vh - EDGE * 2),
      );

      let width = Math.max(rect.width, 216);
      const left = Math.min(
        Math.max(rect.left, EDGE),
        Math.max(vw - width - EDGE, EDGE),
      );
      width = Math.min(width, vw - left - EDGE);

      return openUp
        ? { left, width, maxHeight, bottom: vh - rect.top + PANEL_GAP }
        : { left, width, maxHeight, top: rect.bottom + PANEL_GAP };
    };

    const apply = () => {
      const next = measure();
      if (
        last &&
        next.left === last.left &&
        next.width === last.width &&
        next.maxHeight === last.maxHeight &&
        next.top === last.top &&
        next.bottom === last.bottom
      ) {
        return;
      }
      last = next;
      setPanelRect(next);
    };

    apply();

    const handleResize = () => apply();
    const handleScroll = (event: Event) => {
      // Ignore scrolls originating inside the dropdown.
      const target = event.target;
      if (
        panelRef.current &&
        target instanceof Node &&
        panelRef.current.contains(target)
      ) {
        return;
      }
      apply();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  // Reveal the expanded country once, as soon as the panel is on screen.
  // Smooth scroll (not an instant jump) so the panel glides down gently.
  useEffect(() => {
    if (!open || !panelRect || didAutoScroll.current) return;
    didAutoScroll.current = true;
    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      const active = panel?.querySelector<HTMLElement>('[data-active="true"]');
      if (!panel || !active) return;
      const top = active.offsetTop;
      const bottom = top + active.offsetHeight;
      let nextTop: number | null = null;
      if (top < panel.scrollTop) {
        nextTop = top - 4;
      } else if (bottom > panel.scrollTop + panel.clientHeight) {
        nextTop = bottom - panel.clientHeight + 4;
      }
      if (nextTop !== null) {
        panel.scrollTo({ top: nextTop, behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, panelRect]);

  // Stop pointer-downs inside the dropdown from reaching document-level
  // "outside click" listeners (for example the chat panel's). Without this a
  // tap on a city can be treated as a click outside and close the panel behind
  // the dropdown.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const stop = (event: Event) => event.stopPropagation();
    panel.addEventListener("pointerdown", stop);
    return () => panel.removeEventListener("pointerdown", stop);
  }, [open, panelRect]);

  // Close on outside pointer-down and on Escape.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelectCity = (id: LocationId) => {
    onChange(id);
    setOpen(false);
  };

  const isChat = size === "chat";

  const triggerClasses = isChat
    ? "flex w-full items-center gap-1.5 rounded-lg border border-[#e8e5ed] bg-white py-1.5 pl-2 pr-2 text-left text-xs font-medium outline-none transition focus:border-[#6754e7] hover:border-[#d7d2e6]"
    : "flex h-11 w-full items-center gap-2 rounded-xl border border-[#dedbe4] bg-white pl-3.5 pr-9 text-left text-sm font-semibold text-[#403c47] outline-none transition focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10";

  return (
    <span className={`relative block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={triggerClasses}
      >
        <Icon name="globe" className="h-4 w-4 shrink-0 text-[#6d58db]" />
        <span className="min-w-0 flex-1 truncate">
          {isChat ? selectedLocation?.city ?? selectedLabel : selectedLabel}
        </span>
        <Icon
          name="chevron-down"
          className={`shrink-0 text-[#77727f] transition-transform duration-200 ${
            isChat
              ? "h-3.5 w-3.5"
              : "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        panelRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-label={ariaLabel}
            data-location-select-panel
            style={
              {
                position: "fixed",
                left: panelRect.left,
                width: panelRect.width,
                maxHeight: panelRect.maxHeight,
                top: panelRect.top,
                bottom: panelRect.bottom,
              } as CSSProperties
            }
            className="z-[120] overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth rounded-xl border border-[#e6e3ec] bg-white p-1 shadow-[0_18px_50px_rgba(30,20,60,0.22)]"
          >
            {countries.map((country) => {
              const countryLocations = locationsByCountry.get(country.id) ?? [];
              const expanded = country.id === expandedCountryId;
              const countryHasSelection = countryLocations.some(
                (loc) => loc.id === value,
              );

              return (
                <div key={country.id} role="group" aria-label={country.country}>
                  <button
                    type="button"
                    data-active={expanded}
                    aria-expanded={expanded}
                    onClick={() =>
                      setExpandedCountryId((current) =>
                        current === country.id ? "" : country.id,
                      )
                    }
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${
                      countryHasSelection
                        ? "text-[#5b4abe]"
                        : "text-[#403c47] hover:bg-[#f6f4fb]"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {country.country}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-[#a29ea8]">
                      {countryLocations.length}
                    </span>
                    <Icon
                      name="chevron-down"
                      className={`h-3.5 w-3.5 shrink-0 text-[#9a95a0] transition-transform duration-200 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Smoothly reveal the cities: 0fr -> 1fr grid rows, clipped. */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: expanded ? "1fr" : "0fr",
                      transition:
                        "grid-template-rows 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease",
                      opacity: expanded ? 1 : 0,
                      willChange: "grid-template-rows, opacity",
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-1 pl-1.5">
                        {countryLocations.map((loc) => {
                          const selected = loc.id === value;
                          return (
                            <button
                              key={loc.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => handleSelectCity(loc.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                                selected
                                  ? "bg-[#f1edff] font-semibold text-[#5b4abe]"
                                  : "text-[#5f5b66] hover:bg-[#f8f7fc]"
                              }`}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {loc.city}
                              </span>
                              {selected && (
                                <Icon
                                  name="check"
                                  className="h-3.5 w-3.5 shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </span>
  );
}
