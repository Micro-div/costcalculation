"use client";

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

/**
 * Native country/city picker. A real <select> with <optgroup> is used on
 * purpose: it is keyboard and screen-reader friendly, opens the OS picker on
 * mobile and needs no portal, positioning or outside-click handling.
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
  const isChat = size === "chat";

  return (
    <span className={`relative block ${className}`}>
      <Icon
        name="globe"
        className={`pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#6d58db] ${
          isChat ? "h-3.5 w-3.5" : "h-4 w-4"
        }`}
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as LocationId)}
        aria-label={ariaLabel}
        className={
          isChat
            ? "w-full appearance-none rounded-lg border border-[#e8e5ed] bg-white py-1.5 pl-7 pr-7 text-xs font-medium text-[#403c47] outline-none transition hover:border-[#d7d2e6] focus:border-[#6754e7]"
            : "h-11 w-full appearance-none rounded-xl border border-[#dedbe4] bg-white pl-10 pr-9 text-sm font-semibold text-[#403c47] outline-none transition focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10"
        }
      >
        {countries.map((country) => {
          const cities = locations.filter(
            (location) => location.countryId === country.id,
          );
          if (cities.length === 0) return null;
          return (
            <optgroup key={country.id} label={country.country}>
              {cities.map((location) => (
                <option key={location.id} value={location.id}>
                  {isChat
                    ? location.city
                    : `${location.city}, ${location.country}`}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      <Icon
        name="chevron-down"
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77727f] ${
          isChat ? "h-3.5 w-3.5" : "h-4 w-4"
        }`}
      />
    </span>
  );
}
