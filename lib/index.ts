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
} from "@/types";
import { analyzeProjectWithAi } from "./analyzeProject";
import type { AiAnalysisPayload } from "./aiAnalysis";

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
    complexity: analysis.complexity,
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
