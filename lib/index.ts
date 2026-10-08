import {
  categories,
  locations,
  projectSizes,
  qualityOptions,
  USD_RATES,
} from "@/constants";
import type {
  CategoryId,
  CurrencyCode,
  EstimateItem,
  EstimateResult,
  Location,
  LocationId,
  ProjectSizeId,
  QualityId,
  ScopeItem,
  TimelineUnit,
} from "@/types";
import { analyzeProjectWithAi } from "./analyzeProject";
import type { AiAnalysisPayload, AiCostComponent } from "./aiAnalysis";

// Turns the AI-provided cost components into authoritative breakdown rows:
// their costs are re-scaled so they always add up to the computed subtotal,
// and percentages are derived from the final costs. Returns undefined when
// the AI didn't provide usable components (caller falls back to `items`).
//
// The AI's REAL amounts win whenever most components carry one: those are the
// market costs for the user's location, and rounded percentages ("2%" on a
// 2.4% line) must not silently rewrite them. The percentage split is only
// used when the amounts are missing or zero.
function buildCostComponents(
  raw: AiCostComponent[] | undefined,
  subtotal: number,
): EstimateResult["components"] {
  if (!Array.isArray(raw) || raw.length === 0 || subtotal <= 0) {
    return undefined;
  }
  const usable = raw.filter(
    (c) =>
      typeof c?.name === "string" &&
      c.name.trim() &&
      Number.isFinite(c?.cost) &&
      c.cost >= 0 &&
      Number.isFinite(c?.percentage) &&
      c.percentage >= 0,
  );
  if (usable.length === 0) return undefined;

  const positiveCosts = usable.filter((c) => c.cost > 0).length;
  const percentagesUsable = usable.every((c) => c.percentage > 0);
  const useCosts =
    positiveCosts >= Math.max(2, Math.ceil(usable.length / 2)) ||
    !percentagesUsable;
  let weights = usable.map((c) => (useCosts ? c.cost : c.percentage));
  if (weights.reduce((sum, w) => sum + w, 0) <= 0) {
    weights = usable.map((c) => (c.percentage > 0 ? c.percentage : 1));
  }
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weightSum <= 0) return undefined;

  const components = usable.map((c, index) => ({
    name: c.name.trim(),
    cost: roundMoney(subtotal * (weights[index] / weightSum)),
    percentage: 0,
    note: typeof c.note === "string" ? c.note.trim() : "",
  }));

  // Fix rounding drift so the components always sum exactly to the subtotal.
  const drift = subtotal - components.reduce((sum, c) => sum + c.cost, 0);
  if (components.length > 0 && drift !== 0) {
    const largest = components.reduce(
      (maxIdx, c, idx) => (c.cost > components[maxIdx].cost ? idx : maxIdx),
      0,
    );
    components[largest].cost = Math.max(0, components[largest].cost + drift);
  }

  for (const c of components) {
    c.percentage = Math.round((c.cost / subtotal) * 100);
  }
  return components;
}

// Used whenever the AI did not provide its own component split (network
// failure, missing key, bad output): the card still shows a real,
// multi-line breakdown instead of one generic line.
function buildGenericComponents(
  subtotal: number,
): EstimateResult["components"] {
  if (subtotal <= 0) return undefined;
  const shares = [
    { name: "Design", weight: 0.18, note: "Visuals and planning" },
    { name: "Build", weight: 0.34, note: "Core delivery work" },
    { name: "Labour", weight: 0.23, note: "Team execution time" },
    { name: "Testing", weight: 0.12, note: "Quality checks and fixes" },
    { name: "Management", weight: 0.13, note: "Coordination and delivery" },
  ];
  const components = shares.map((s) => ({
    name: s.name,
    cost: roundMoney(subtotal * s.weight),
    percentage: 0,
    note: s.note,
  }));
  const drift = subtotal - components.reduce((sum, c) => sum + c.cost, 0);
  components[1].cost = Math.max(0, components[1].cost + drift);
  for (const c of components) {
    c.percentage = Math.round((c.cost / subtotal) * 100);
  }
  return components;
}

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
// The unit comes from the AI's timeline for the project type, so physical
// builds read in months/years instead of weeks.
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

export function detectLocation(description: string): LocationId {
  const value = description.toLowerCase();
  const matches: Array<{ words: string[]; id: LocationId }> = [
    { words: ["canada", "toronto", "vancouver", "montreal"], id: "ca" },
    {
      words: ["united states", "usa", "new york", "san francisco", "texas"],
      id: "us",
    },
    { words: ["united kingdom", "uk", "london", "manchester"], id: "uk" },
    { words: ["dubai", "uae", "abu dhabi"], id: "ae" },
    { words: ["pakistan", "karachi", "lahore", "islamabad"], id: "pk" },
    { words: ["india", "mumbai", "delhi", "bangalore"], id: "in" },
    { words: ["australia", "sydney", "melbourne"], id: "au" },
    { words: ["germany", "berlin", "munich"], id: "de" },
    { words: ["singapore"], id: "sg" },
    { words: ["nigeria", "lagos", "abuja"], id: "ng" },
  ];

  return (
    matches.find(({ words }) => words.some((word) => value.includes(word)))
      ?.id ?? "us"
  );
}

export function calculateEstimate(
  description: string,
  categoryId: CategoryId,
  locationId: LocationId,
  sizeId: ProjectSizeId,
  qualityId: QualityId,
  currencyOverride?: CurrencyCode | null,
  aiAnalysis?: AiAnalysisPayload | null,
): EstimateResult {
  // The optional AI result supplies the project type, features, complexity,
  // subject/heading/confidence AND — when available — its own real-world
  // pricing (low/typical/high in USD for the user's location) and timeline.
  // Preset price ranges are never sent to the AI and never override it.
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

  // Fallback pricing multiplier (country x size x quality), used only when
  // the AI did not price the project itself.
  const multiplier = location.multiplier * size.multiplier * quality.multiplier;
  const aiPricing = analysis.aiPricing;
  // Only the user's chosen size and quality adjust an AI-priced project: the
  // AI already priced it at real-world market cost for THIS location, so the
  // location multiplier must not be applied a second time.
  const sizeQuality = size.multiplier * quality.multiplier;

  let items: EstimateItem[];
  let components: EstimateResult["components"];
  let subtotal: number;

  if (aiPricing) {
    // REAL-WORLD PATH: the AI's own typical market cost for the location.
    subtotal = roundMoney(aiPricing.typical * sizeQuality * fx);
    components =
      buildCostComponents(aiAnalysis?.components, subtotal) ??
      buildGenericComponents(subtotal);
    // The breakdown table and the quotation mirror the AI's component split
    // (land, enclosures, animals, labour...) instead of preset software lines.
    items = (components ?? []).map((component) => ({
      name: component.name,
      detail: component.note || "Included in the project cost",
      quantity: 1,
      rate: component.cost,
    }));
    if (items.length === 0) {
      items = [
        {
          name: analysis.aiProjectType || analysis.projectType,
          detail: "Total project cost",
          quantity: 1,
          rate: subtotal,
        },
      ];
    }
  } else {
    // Fallback path: static USD config (PROJECT_TYPES / FEATURES x country,
    // size and quality multipliers).
    items = analysis.lines.map((line) => ({
      name: line.label,
      detail: line.detail,
      quantity: 1,
      rate: roundMoney(line.usd * multiplier * fx),
    }));
    subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    );
    components =
      buildCostComponents(aiAnalysis?.components, subtotal) ??
      buildGenericComponents(subtotal);
  }

  const contingency = roundMoney(subtotal * 0.05);
  const taxes = roundMoney((subtotal + contingency) * location.taxRate);
  const total = subtotal + contingency + taxes;

  // Low/typical/high: from the AI's own range when it priced the project,
  // scaled by the same size/quality/currency/contingency/tax factors as the
  // total so the range always brackets it. Only the fallback derives them.
  const low = aiPricing
    ? roundMoney(aiPricing.low * sizeQuality * fx * 1.05 * (1 + location.taxRate))
    : roundMoney(total * 0.88);
  const high = aiPricing
    ? roundMoney(aiPricing.high * sizeQuality * fx * 1.05 * (1 + location.taxRate))
    : roundMoney(total * 1.17);

  // Timeline: the AI's realistic duration for the project type (months or
  // years for physical builds) when present, else the preset weeks estimate.
  const aiDuration = analysis.aiDuration;
  const weekFactor = size.weekFactor * quality.weekFactor;
  const durationMin = aiDuration
    ? aiDuration.min
    : Math.max(1, Math.round(analysis.weeksMin * weekFactor));
  const durationMax = aiDuration
    ? aiDuration.max
    : Math.max(durationMin + 1, Math.round(analysis.weeksMax * weekFactor));
  const durationUnit: TimelineUnit =
    aiDuration && ["weeks", "months", "years"].includes(aiDuration.unit)
      ? (aiDuration.unit as TimelineUnit)
      : "weeks";

  const confidence = Math.min(
    94,
    Math.max(20, Math.round(analysis.confidence * 100)),
  );

  return {
    projectTitle: analysis.heading,
    // The AI's own project type, shown in the subtitle instead of the preset
    // category (e.g. "Zoo / Wildlife Park Development" instead of
    // "Website development"). Null when the AI was unavailable.
    projectTypeLabel: analysis.aiProjectType || analysis.aiCategory || null,
    description,
    category,
    location,
    size,
    quality,
    items,
    components,
    subtotal,
    contingency,
    taxes,
    total,
    low,
    high,
    confidence,
    durationMin,
    durationMax,
    durationUnit,
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
