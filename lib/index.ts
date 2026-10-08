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
} from "@/types";
import { analyzeProjectWithAi } from "./analyzeProject";
import type { AiAnalysisPayload, AiCostComponent } from "./aiAnalysis";

// Turns the AI-provided cost components into authoritative breakdown rows:
// their costs are re-scaled so they always add up to our computed subtotal,
// and percentages are derived from the final costs. Returns undefined when
// the AI didn't provide usable components (caller falls back to `items`).
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

  const percentagesUsable = usable.every((c) => c.percentage > 0);
  const costsUsable = usable.some((c) => c.cost > 0);
  const weights = usable.map((c) =>
    percentagesUsable ? c.percentage : costsUsable ? c.cost : 1,
  );
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
  // The optional AI result only supplies category/features/complexity/subject/
  // heading/confidence; every price below is still computed from the static
  // USD config (PROJECT_TYPES / FEATURES / COMPLEXITY in analyzeProject.js).
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

  // New analyzer-driven base price; country, size and quality multipliers
  // (and later the currency conversion, contingency and tax) still apply.
  const multiplier = location.multiplier * size.multiplier * quality.multiplier;
  const items: EstimateItem[] = analysis.lines.map((line) => ({
    name: line.label,
    detail: line.detail,
    quantity: 1,
    rate: roundMoney(line.usd * multiplier * fx),
  }));
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0,
  );
  const components =
    buildCostComponents(aiAnalysis?.components, subtotal) ??
    buildGenericComponents(subtotal);
  const contingency = roundMoney(subtotal * 0.05);
  const taxes = roundMoney((subtotal + contingency) * location.taxRate);
  const total = subtotal + contingency + taxes;
  const weekFactor = size.weekFactor * quality.weekFactor;
  const durationMin = Math.max(
    1,
    Math.round(analysis.weeksMin * weekFactor),
  );
  const durationMax = Math.max(
    durationMin + 1,
    Math.round(analysis.weeksMax * weekFactor),
  );
  const confidence = Math.min(
    94,
    Math.max(20, Math.round(analysis.confidence * 100)),
  );

  return {
    projectTitle: analysis.heading,
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
    low: roundMoney(total * 0.88),
    high: roundMoney(total * 1.17),
    confidence,
    durationMin,
    durationMax,
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
