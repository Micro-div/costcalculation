// ===========================================================================
// RULE-BASED PRICING ENGINE
// ===========================================================================
// The AI is only an extractor: it reads the user's description and tells us
// WHAT the project is (type, features, quantities, location hint). It never
// returns a price, a timeline, a confidence score or a cost breakdown.
//
// This file owns every number that reaches the UI:
//   - USD rate cards (base price + feature add-ons + physical unit rates)
//   - size/quality/complexity factors
//   - duration and confidence formulas
// The location multiplier, currency exchange rates and sales-tax rates live in
// `constants/index.ts` together with their last-updated dates.

import { PRICING_META } from "@/constants";
import type {
  CostComponent,
  CurrencyCode,
  EstimateItem,
  Location,
  ProjectSize,
  QualityOption,
  TimelineUnit,
} from "@/types";
import { FEATURES, PROJECT_TYPES } from "@/lib/analyzeProject";

export { PRICING_META };

// Shared everywhere a contingency is applied (estimate result, quotation and
// printed documents) so the three can never disagree.
export const CONTINGENCY_RATE = 0.05;

export type ProjectKind = "physical" | "software" | "service";
export type ComplexityLevel = "Basic" | "Standard" | "Advanced";

export interface ProjectQuantities {
  acres?: number;
  rooms?: number;
  floors?: number;
  units?: number;
  animals?: number;
  squareMeters?: number;
  kilometers?: number;
  staff?: number;
}

export interface QuantityField {
  key: keyof ProjectQuantities;
  label: string;
}

export const QUANTITY_FIELDS: QuantityField[] = [
  { key: "acres", label: "acres" },
  { key: "rooms", label: "rooms" },
  { key: "floors", label: "floors" },
  { key: "units", label: "units" },
  { key: "animals", label: "animals" },
  { key: "squareMeters", label: "square metres" },
  { key: "kilometers", label: "kilometres" },
  { key: "staff", label: "staff" },
];

const COMPLEXITY_FACTOR: Record<ComplexityLevel, number> = {
  Basic: 0.85,
  Standard: 1,
  Advanced: 1.3,
};

export function complexityFactor(complexity: ComplexityLevel): number {
  return COMPLEXITY_FACTOR[complexity] ?? 1;
}

// ---------------------------------------------------------------------------
// Software / service rate cards (USD).
// These mirror the labels in lib/analyzeProject.ts, but the PRICES below are
// the single source of truth used by calculateEstimate().
// ---------------------------------------------------------------------------
export interface RateCard {
  key: string;
  label: string;
  projectType: string;
  baseUSD: number;
  baseWeeks: number;
}

export const SOFTWARE_RATE_CARDS: Record<string, RateCard> = Object.fromEntries(
  (
    PROJECT_TYPES as Array<{
      key: string;
      label: string;
      projectType: string;
      basePriceUSD: number;
      baseWeeks: number;
    }>
  ).map((type) => [
    type.key,
    {
      key: type.key,
      label: type.label,
      projectType: type.projectType,
      baseUSD: type.basePriceUSD,
      baseWeeks: type.baseWeeks,
    },
  ]),
);

export interface FeatureRate {
  label: string;
  priceUSD: number;
  weeks: number;
}

export const FEATURE_RATES: Record<string, FeatureRate> = Object.fromEntries(
  (
    FEATURES as Array<{ label: string; price: number; weeks: number }>
  ).map((feature) => [
    feature.label,
    {
      label: feature.label,
      priceUSD: feature.price,
      weeks: feature.weeks,
    },
  ]),
);

export const CANONICAL_FEATURES = Object.keys(FEATURE_RATES);

// ---------------------------------------------------------------------------
// Physical rate cards. Physical projects are priced from unit rates (acre,
// room, m², km, animal) instead of the software base cards. Values are
// conservative USD planning rates and intentionally rounded.
// ---------------------------------------------------------------------------
interface PhysicalComponentRate {
  name: string;
  note: string;
  share: number;
}

interface PhysicalRateCard {
  key: string;
  label: string;
  keywords: string[];
  baseUSD: number;
  perAcre?: number;
  perAnimal?: number;
  perRoom?: number;
  perFloor?: number;
  perUnit?: number;
  perSquareMeter?: number;
  perKilometer?: number;
  baseMonths: number;
  monthPerAcre?: number;
  monthPer1000Sqm?: number;
  components: PhysicalComponentRate[];
}

const PHYSICAL_RATE_CARDS: PhysicalRateCard[] = [
  {
    key: "zoo",
    label: "Zoo / wildlife park",
    keywords: ["zoo", "wildlife", "safari", "aquarium", "animal park"],
    baseUSD: 150_000,
    perAcre: 45_000,
    perAnimal: 2_500,
    baseMonths: 12,
    monthPerAcre: 0.35,
    components: [
      { name: "Land & site preparation", note: "Clearing, grading and access roads", share: 0.14 },
      { name: "Enclosures & habitats", note: "Fencing, shelters and habitat works", share: 0.3 },
      { name: "Animal acquisition", note: "Purchase, transport and quarantine", share: 0.16 },
      { name: "Veterinary facility", note: "Clinic and animal care equipment", share: 0.08 },
      { name: "Staff & labour", note: "Keepers and site crew", share: 0.13 },
      { name: "Utilities", note: "Water, power and waste systems", share: 0.06 },
      { name: "Visitor facilities", note: "Ticketing, paths and amenities", share: 0.05 },
      { name: "Permits & licences", note: "Planning and wildlife approvals", share: 0.04 },
      { name: "Security & landscaping", note: "Perimeter security and planting", share: 0.04 },
    ],
  },
  {
    key: "farm",
    label: "Farm / agricultural",
    keywords: ["farm", "agricultural", "livestock", "cattle", "dairy", "poultry", "orchard"],
    baseUSD: 60_000,
    perAcre: 9_000,
    perAnimal: 600,
    baseMonths: 6,
    monthPerAcre: 0.15,
    components: [
      { name: "Land preparation", note: "Soil works, drainage and access", share: 0.2 },
      { name: "Buildings & shelters", note: "Barns, sheds and storage", share: 0.26 },
      { name: "Livestock & planting", note: "Animals, seeds and stock", share: 0.2 },
      { name: "Equipment", note: "Machinery, irrigation and tools", share: 0.16 },
      { name: "Labour", note: "Construction and setup crew", share: 0.1 },
      { name: "Permits & utilities", note: "Approvals and service connections", share: 0.08 },
    ],
  },
  {
    key: "road",
    label: "Road / infrastructure",
    keywords: ["road", "highway", "bridge", "pipeline", "infrastructure", "railway", "dam"],
    baseUSD: 100_000,
    perKilometer: 900_000,
    baseMonths: 10,
    components: [
      { name: "Survey & design", note: "Engineering and site surveys", share: 0.08 },
      { name: "Earthworks", note: "Excavation, grading and compaction", share: 0.24 },
      { name: "Materials", note: "Aggregate, asphalt, concrete and steel", share: 0.34 },
      { name: "Labour & equipment", note: "Crews, plant and machinery", share: 0.2 },
      { name: "Drainage & safety", note: "Culverts, markings and barriers", share: 0.08 },
      { name: "Permits & supervision", note: "Approvals and site management", share: 0.06 },
    ],
  },
  {
    key: "warehouse",
    label: "Warehouse / factory",
    keywords: ["warehouse", "factory", "industrial", "plant", "manufacturing", "workshop"],
    baseUSD: 80_000,
    perSquareMeter: 420,
    baseMonths: 7,
    monthPer1000Sqm: 1.2,
    components: [
      { name: "Land & foundations", note: "Site works and structural base", share: 0.2 },
      { name: "Structure & cladding", note: "Steel frame, walls and roof", share: 0.3 },
      { name: "MEP services", note: "Power, water and ventilation", share: 0.16 },
      { name: "Fixtures & equipment", note: "Racking, machinery and fit-out", share: 0.18 },
      { name: "Labour", note: "Construction and installation crew", share: 0.1 },
      { name: "Permits & fees", note: "Approvals and professional fees", share: 0.06 },
    ],
  },
  {
    key: "construction",
    label: "Building construction",
    keywords: ["construction", "building", "apartment", "house", "villa", "office building", "tower"],
    baseUSD: 50_000,
    perSquareMeter: 550,
    perFloor: 25_000,
    baseMonths: 8,
    monthPer1000Sqm: 1,
    components: [
      { name: "Design & approvals", note: "Architecture, engineering and permits", share: 0.09 },
      { name: "Site & foundations", note: "Excavation, piling and concrete base", share: 0.19 },
      { name: "Structure", note: "Frame, floors, walls and roof", share: 0.28 },
      { name: "MEP & finishes", note: "Services, flooring, painting and joinery", share: 0.28 },
      { name: "Labour & equipment", note: "Crews, plant and site management", share: 0.12 },
      { name: "Contingency works", note: "Unforeseen site conditions", share: 0.04 },
    ],
  },
  {
    key: "fitout",
    label: "Shop / office fit-out",
    keywords: ["fit-out", "fitout", "shop", "store", "showroom", "restaurant", "cafe", "salon", "office interior"],
    baseUSD: 30_000,
    perSquareMeter: 400,
    perRoom: 8_000,
    baseMonths: 4,
    monthPer1000Sqm: 1.5,
    components: [
      { name: "Design & drawings", note: "Layout and interior design", share: 0.08 },
      { name: "Construction works", note: "Partitions, ceiling and flooring", share: 0.3 },
      { name: "Fixtures & furniture", note: "Counters, racks and seating", share: 0.24 },
      { name: "MEP services", note: "Electrical, plumbing and HVAC", share: 0.16 },
      { name: "Signage & branding", note: "Interior and exterior signage", share: 0.1 },
      { name: "Labour & permits", note: "Installation, approvals and management", share: 0.12 },
    ],
  },
  {
    key: "venue",
    label: "Venue / event space",
    keywords: ["venue", "stadium", "theatre", "cinema", "event space", "conference", "hotel", "resort"],
    baseUSD: 120_000,
    perRoom: 18_000,
    perSquareMeter: 500,
    baseMonths: 8,
    monthPer1000Sqm: 1,
    components: [
      { name: "Design & permits", note: "Plans, engineering and approvals", share: 0.08 },
      { name: "Construction", note: "Structure, envelope and interiors", share: 0.34 },
      { name: "Fixtures & equipment", note: "Seating, AV and specialist kit", share: 0.24 },
      { name: "MEP & safety", note: "Services, fire and accessibility", share: 0.18 },
      { name: "Labour", note: "Build and installation crews", share: 0.1 },
      { name: "Launch & marketing", note: "Opening campaign and signage", share: 0.06 },
    ],
  },
];

interface PhysicalMatch {
  card: PhysicalRateCard;
  score: number;
}

export function detectPhysicalRateCard(text: string): PhysicalRateCard | null {
  const haystack = String(text ?? "").toLowerCase();
  let best: PhysicalMatch | null = null;
  for (const card of PHYSICAL_RATE_CARDS) {
    let score = 0;
    for (const keyword of card.keywords) {
      if (new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack)) {
        score += keyword.length;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { card, score };
    }
  }
  return best?.card ?? null;
}

export function physicalRateCardKeys(): string[] {
  return PHYSICAL_RATE_CARDS.map((card) => card.key);
}

function physicalAmount(card: PhysicalRateCard, quantities: ProjectQuantities): number {
  return (
    card.baseUSD +
    (card.perAcre ?? 0) * (quantities.acres ?? 0) +
    (card.perAnimal ?? 0) * (quantities.animals ?? 0) +
    (card.perRoom ?? 0) * (quantities.rooms ?? 0) +
    (card.perFloor ?? 0) * (quantities.floors ?? 0) +
    (card.perUnit ?? 0) * (quantities.units ?? 0) +
    (card.perSquareMeter ?? 0) * (quantities.squareMeters ?? 0) +
    (card.perKilometer ?? 0) * (quantities.kilometers ?? 0)
  );
}

function physicalMonths(card: PhysicalRateCard, quantities: ProjectQuantities): number {
  return Math.max(
    2,
    Math.round(
      card.baseMonths +
        (card.monthPerAcre ?? 0) * (quantities.acres ?? 0) +
        (card.monthPer1000Sqm ?? 0) * ((quantities.squareMeters ?? 0) / 1000),
    ),
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function roundMoney(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function buildComponents(subtotal: number, entries: Array<{ name: string; note: string; amount: number }>): CostComponent[] {
  if (subtotal <= 0) return [];
  const components = entries
    .map((entry) => ({
      name: entry.name,
      cost: roundMoney(entry.amount),
      percentage: 0,
      note: entry.note,
    }))
    .filter((component) => component.cost > 0);

  // Fix rounding drift so percentages always describe the subtotal.
  const sum = components.reduce((total, component) => total + component.cost, 0);
  if (components.length > 0 && sum !== subtotal) {
    const drift = subtotal - sum;
    components[0].cost = Math.max(0, components[0].cost + drift);
  }
  for (const component of components) {
    component.percentage = Math.round((component.cost / subtotal) * 100);
  }
  return components;
}

function itemsFromComponents(components: CostComponent[]): EstimateItem[] {
  return components.map((component) => ({
    name: component.name,
    detail: component.note || "Included in the project cost",
    quantity: 1,
    rate: component.cost,
  }));
}

export interface PriceRequirements {
  /** Rule-card key ("web", "food", "zoo", "fitout"...). */
  projectTypeKey: string;
  kind: ProjectKind;
  complexity: ComplexityLevel;
  features: string[];
  quantities: ProjectQuantities;
  description: string;
  location: Location;
  size: ProjectSize;
  quality: QualityOption;
  currency: CurrencyCode;
  /** True when the description names a known city/country. */
  namedLocation: boolean;
}

export interface PriceResult {
  items: EstimateItem[];
  components: CostComponent[];
  subtotal: number;
  durationMin: number;
  durationMax: number;
  durationUnit: TimelineUnit;
  confidence: number;
  rateCardKey: string;
  rateCardLabel: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Completeness-based confidence. The model never supplies this number: it is
 * derived from how much of the requirement set the extractor actually found.
 */
export function computeConfidence(input: {
  projectTypeKey: string;
  kind: ProjectKind;
  features: string[];
  quantities: ProjectQuantities;
  description: string;
  namedLocation: boolean;
}): number {
  let score = 30;
  if (input.projectTypeKey && input.projectTypeKey !== "other" && input.projectTypeKey !== "physical-generic") {
    score += 12;
  }
  if (input.kind === "physical" || input.kind === "software" || input.kind === "service") {
    score += 4;
  }
  score += Math.min(3, input.features.length) * 5;
  const quantityCount = Object.values(input.quantities).filter(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0,
  ).length;
  if (quantityCount > 0) score += 14;
  if (quantityCount > 1) score += 5;
  if (input.namedLocation) score += 6;
  const length = input.description.trim().length;
  if (length > 60) score += 8;
  if (length > 150) score += 6;
  return clamp(Math.round(score), 20, 94);
}

export function computePrice(input: PriceRequirements): PriceResult {
  const { location, size, quality, currency } = input;
  const currencyFactor =
    currency === "USD" ? 1 : 1; // FX is applied by calculateEstimate().
  void currencyFactor;

  const sizeFactor = size.multiplier;
  const qualityFactor = quality.multiplier;
  const complexity = complexityFactor(input.complexity);

  if (input.kind === "physical") {
    const card =
      PHYSICAL_RATE_CARDS.find((item) => item.key === input.projectTypeKey) ??
      detectPhysicalRateCard(`${input.description} ${input.projectTypeKey}`) ??
      null;

    const baseAmount = card ? physicalAmount(card, input.quantities) : 75_000;
    const subtotal = roundMoney(
      baseAmount * complexity * sizeFactor * qualityFactor * location.multiplier,
    );
    const components = card
      ? buildComponents(
          subtotal,
          card.components.map((component) => ({
            name: component.name,
            note: component.note,
            amount: subtotal * component.share,
          })),
        )
      : buildComponents(subtotal, [
          { name: "Site & works", note: "Core physical works", amount: subtotal * 0.45 },
          { name: "Materials & equipment", note: "Materials and equipment", amount: subtotal * 0.3 },
          { name: "Labour", note: "Site labour and supervision", amount: subtotal * 0.15 },
          { name: "Permits & management", note: "Approvals and project management", amount: subtotal * 0.1 },
        ]);

    const months = card ? physicalMonths(card, input.quantities) : 6;
    const adjustedMonths = Math.max(
      2,
      Math.round(months * (0.75 + sizeFactor * 0.25) * (0.9 + qualityFactor * 0.1)),
    );
    const durationMin = Math.max(2, Math.round(adjustedMonths * 0.85));
    const durationMax = Math.max(durationMin + 1, Math.round(adjustedMonths * 1.2));

    return {
      items: itemsFromComponents(components),
      components,
      subtotal,
      durationMin,
      durationMax,
      durationUnit: adjustedMonths >= 24 ? "years" : "months",
      confidence: computeConfidence(input),
      rateCardKey: card?.key ?? "physical-generic",
      rateCardLabel: card?.label ?? "Physical project",
    };
  }

  const card =
    SOFTWARE_RATE_CARDS[input.projectTypeKey] ?? SOFTWARE_RATE_CARDS.other;
  const featureRates = input.features
    .map((label) => FEATURE_RATES[label])
    .filter((rate): rate is FeatureRate => Boolean(rate));

  const factor =
    complexity * sizeFactor * qualityFactor * location.multiplier;

  const coreUSD = roundMoney(card.baseUSD * factor);
  const featureEntries = featureRates.map((rate) => ({
    name: rate.label,
    detail: "Add-on feature (rule-based rate card)",
    usd: roundMoney(rate.priceUSD * factor),
    weeks: rate.weeks,
  }));

  const items: EstimateItem[] = [
    {
      name: card.projectType,
      detail: "Core delivery from the priced scope",
      quantity: 1,
      rate: coreUSD,
    },
    ...featureEntries.map((entry) => ({
      name: entry.name,
      detail: entry.detail,
      quantity: 1,
      rate: entry.usd,
    })),
  ].filter((item) => item.rate > 0);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  // A stable workstream split, weighted by the actual line items. This keeps
  // the breakdown rule-derived instead of asking the model for fake amounts.
  const shareBase = subtotal || 1;
  const designShare = 0.18;
  const buildShare = 0.34;
  const labourShare = 0.23;
  const testingShare = 0.12;
  const managementShare = 0.13;
  const components = buildComponents(subtotal, [
    { name: "Design", note: "Visuals, planning and UX", amount: shareBase * designShare },
    { name: "Build", note: "Core delivery work", amount: shareBase * buildShare },
    { name: "Labour", note: "Team execution time", amount: shareBase * labourShare },
    { name: "Testing", note: "Quality checks and fixes", amount: shareBase * testingShare },
    { name: "Management", note: "Coordination and delivery", amount: shareBase * managementShare },
  ]);

  const weeks = card.baseWeeks + featureEntries.reduce((sum, entry) => sum + entry.weeks, 0);
  const adjustedWeeks = Math.max(
    1,
    Math.round(weeks * size.weekFactor * quality.weekFactor),
  );
  const durationMin = Math.max(1, Math.round(adjustedWeeks * 0.85));
  const durationMax = Math.max(durationMin + 1, Math.round(adjustedWeeks * 1.25));

  return {
    items,
    components,
    subtotal,
    durationMin,
    durationMax,
    durationUnit: "weeks",
    confidence: computeConfidence(input),
    rateCardKey: card.key,
    rateCardLabel: card.label,
  };
}
