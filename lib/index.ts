import {
  categories,
  countries,
  locations,
  projectSizes,
  qualityOptions,
  USD_RATES,
} from "@/constants";
import type {
  Category,
  CategoryId,
  CurrencyCode,
  EstimateResult,
  Location,
  LocationId,
  ProjectSizeId,
  QualityId,
  TimelineUnit,
} from "@/types";
import { analyzeProjectWithAi } from "./analyzeProject";
import type { AiAnalysisPayload } from "./aiAnalysis";
import {
  CONTINGENCY_RATE,
  computePrice,
  detectPhysicalRateCard,
  type PriceResult,
} from "./pricing";

export function roundMoney(value: number) {
  return Math.round(value);
}

const DURATION_LABELS: Record<
  TimelineUnit,
  { one: string; many: string; oneShort: string; manyShort: string }
> = {
  weeks: { one: "week", many: "weeks", oneShort: "wk", manyShort: "wks" },
  months: { one: "month", many: "months", oneShort: "mo", manyShort: "mo" },
  years: { one: "year", many: "years", oneShort: "yr", manyShort: "yrs" },
};

// "3–4 weeks", "14–22 months", "2–3 years" (or the short forms "3–4 wks").
// The unit comes from the rule engine, so physical builds read in months/years
// instead of weeks.
export function formatDurationRange(
  min: number,
  max: number,
  unit: TimelineUnit = "weeks",
  short = false,
): string {
  const labels = DURATION_LABELS[unit] ?? DURATION_LABELS.weeks;
  const lo = Math.round(min);
  const hi = Math.round(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0) {
    return "";
  }
  const many = short ? labels.manyShort : labels.many;
  const one = short ? labels.oneShort : labels.one;
  if (lo === hi) return `${lo} ${lo === 1 ? one : many}`;
  return `${lo}–${Math.max(lo, hi)} ${many}`;
}

export function formatCurrency(value: number, location: Location) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: location.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number, location: Location) {
  const symbol = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: location.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .formatToParts(value)
    .find((part) => part.type === "currency")?.value;

  if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)
    return `${symbol}${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `${symbol}${Math.round(value)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Names that are ordinary English words ("nice") must not be picked up from a
// casual sentence. They only count when used as a place: capitalised and
// preceded by a location preposition or followed by a comma.
const AMBIGUOUS_CITY_PATTERNS: Record<string, RegExp> = {
  nice: /(?:^|[,\s])(?:in|at|from|near|to|based in|located in)\s+Nice\b|\bNice\s*,/,
};

// Finds an explicit city or country name in the text using WHOLE-WORD
// matching. Substring matching used to turn "usage-based" into the USA,
// "ukulele" into the UK and "a nice website" into Nice, France.
export function matchLocation(text: string): LocationId | null {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;

  const sortedCities = [...locations].sort(
    (a, b) => b.city.length - a.city.length,
  );
  for (const loc of sortedCities) {
    const ambiguous = AMBIGUOUS_CITY_PATTERNS[loc.city.toLowerCase()];
    if (ambiguous) {
      if (ambiguous.test(raw)) return loc.id;
      continue;
    }
    if (new RegExp(`\\b${escapeRegExp(loc.city)}\\b`, "i").test(raw)) {
      return loc.id;
    }
  }

  for (const country of countries) {
    if (
      new RegExp(`\\b${escapeRegExp(country.country)}\\b`, "i").test(raw)
    ) {
      const first = locations.find((loc) => loc.countryId === country.id);
      if (first) return first.id;
    }
  }

  const aliases: Array<{ words: string[]; id: LocationId }> = [
    { words: ["usa", "america", "united states"], id: "us" },
    { words: ["uk", "britain", "england", "scotland", "wales"], id: "uk" },
    { words: ["uae", "emirates"], id: "ae" },
    { words: ["holland"], id: "nl" },
    { words: ["saudi"], id: "sa" },
  ];
  for (const { words, id } of aliases) {
    if (
      words.some((word) =>
        new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(raw),
      )
    ) {
      const loc = locations.find((item) => item.id === id);
      if (loc) return loc.id;
    }
  }

  return null;
}

export function detectLocation(description: string): LocationId {
  return matchLocation(description) ?? "us";
}

// A human label for the pricing location, e.g. "Lahore, Pakistan".
export function locationLabel(locationId: LocationId): string {
  const loc = locations.find((item) => item.id === locationId);
  return loc ? `${loc.city}, ${loc.country}` : "";
}

function scalePriceToCurrency(price: PriceResult, factor: number): PriceResult {
  if (factor === 1) return price;
  return {
    ...price,
    items: price.items.map((item) => ({
      ...item,
      rate: roundMoney(item.rate * factor),
    })),
    components: price.components.map((component) => ({
      ...component,
      cost: roundMoney(component.cost * factor),
    })),
    subtotal: roundMoney(price.subtotal * factor),
  };
}

/**
 * Builds an estimate from the user's inputs and — optionally — the AI's
 * extraction of the project. The AI supplies WHAT the project is; the rule
 * engine in lib/pricing.ts supplies every price, timeline and confidence
 * figure. No AI amount is ever added on top of the rule-based result.
 */
export function calculateEstimate(
  description: string,
  categoryId: CategoryId,
  locationId: LocationId,
  sizeId: ProjectSizeId,
  qualityId: QualityId,
  currencyOverride?: CurrencyCode | null,
  aiAnalysis?: AiAnalysisPayload | null,
): EstimateResult {
  const analysis = analyzeProjectWithAi(description, aiAnalysis);
  const category =
    categories.find((item) => item.id === categoryId) ?? categories[0];
  const rawLocation =
    locations.find((item) => item.id === locationId) ?? locations[0];
  const currency: CurrencyCode = currencyOverride ?? rawLocation.currency;
  const location = { ...rawLocation, currency } as Location;
  const fx = USD_RATES[currency] ?? 1;
  const size =
    projectSizes.find((item) => item.id === sizeId) ?? projectSizes[1];
  const quality =
    qualityOptions.find((item) => item.id === qualityId) ?? qualityOptions[1];

  const physicalCard =
    analysis.kind === "physical"
      ? detectPhysicalRateCard(
          `${description} ${analysis.aiProjectType ?? ""} ${
            analysis.aiCategory ?? ""
          } ${analysis.projectType ?? ""}`,
        )
      : null;
  const projectTypeKey =
    analysis.kind === "physical"
      ? (physicalCard?.key ?? "physical-generic")
      : analysis.projectTypeKey;

  const price = scalePriceToCurrency(
    computePrice({
      projectTypeKey,
      kind: analysis.kind,
      complexity: analysis.complexity,
      features: analysis.features,
      quantities: analysis.quantities,
      description,
      location,
      size,
      quality,
      currency,
      namedLocation: matchLocation(description) !== null,
    }),
    fx,
  );

  const subtotal = roundMoney(price.subtotal);
  const contingency = roundMoney(subtotal * CONTINGENCY_RATE);
  const taxes = roundMoney((subtotal + contingency) * location.taxRate);
  const total = subtotal + contingency + taxes;

  return {
    projectTitle: analysis.heading,
    projectTypeLabel: analysis.aiProjectType || analysis.aiCategory || null,
    description,
    category: analysis.aiCategory
      ? ({
          ...category,
          name: analysis.aiCategory,
          shortName: analysis.aiCategory,
          description: `Detected project type: ${analysis.aiCategory}`,
        } as unknown as Category)
      : category,
    location,
    size,
    quality,
    items: price.items,
    components: price.components,
    subtotal,
    contingency,
    taxes,
    total,
    low: roundMoney(total * 0.88),
    high: roundMoney(total * 1.17),
    confidence: price.confidence,
    durationMin: price.durationMin,
    durationMax: price.durationMax,
    durationUnit: price.durationUnit,
    scope: analysis.scope,
    assumptions: analysis.assumptions,
    risks: analysis.risks,
    complexity: analysis.complexity,
    aiSource: aiAnalysis && aiAnalysis.source === "ai" ? "ai" : "fallback",
    aiModel:
      aiAnalysis && aiAnalysis.source === "ai"
        ? (aiAnalysis.model ?? null)
        : null,
  };
}

export function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function detectCurrencyFromLocale(): CurrencyCode {
  try {
    const locale =
      typeof navigator !== "undefined" ? navigator.language : "en-US";
    const parts = new Intl.Locale(locale).region;
    if (parts) {
      const region = parts.toUpperCase();
      const regionToCurrency: Record<string, CurrencyCode> = {
        US: "USD",
        CA: "CAD",
        GB: "GBP",
        AE: "AED",
        PK: "PKR",
        IN: "INR",
        AU: "AUD",
        DE: "EUR",
        SG: "SGD",
        NG: "NGN",
        JP: "JPY",
        CN: "CNY",
        KR: "KRW",
        BR: "BRL",
        MX: "MXN",
        ZA: "ZAR",
        SA: "SAR",
        CH: "CHF",
        SE: "SEK",
        NO: "NOK",
      };
      if (regionToCurrency[region]) return regionToCurrency[region];
    }
  } catch {
    // fallback
  }
  return "USD";
}
