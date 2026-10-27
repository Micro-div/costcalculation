// Server-side validation for the AI extraction output. The model is only
// allowed to describe the project — any price, timeline or confidence field it
// invents is dropped here before it can reach the app.

import { locations } from "@/constants";
import { projectSizes, qualityOptions } from "@/constants";
import { FEATURES, PROJECT_TYPES } from "@/lib/analyzeProject";

export const ALLOWED_CATEGORIES = Array.from(
  new Set(PROJECT_TYPES.map((type) => type.category)),
);
export const ALLOWED_PROJECT_TYPES = PROJECT_TYPES.map(
  (type) => type.projectType,
);
export const ALLOWED_FEATURES = FEATURES.map((feature) => feature.label);
export const ALLOWED_COMPLEXITY = ["Basic", "Standard", "Advanced"];
export const ALLOWED_KINDS = ["physical", "software", "service"] as const;
export const ALLOWED_SIZES = projectSizes.map((size) => size.id);
export const ALLOWED_QUALITIES = qualityOptions.map((quality) => quality.id);

export const MAX_DESCRIPTION_CHARS = 500;
export const MAX_LOCATION_CHARS = 80;

const QUANTITY_KEYS = [
  "acres",
  "rooms",
  "floors",
  "units",
  "animals",
  "squareMeters",
  "kilometers",
  "staff",
] as const;

export interface SanitizedQuantities {
  acres?: number;
  rooms?: number;
  floors?: number;
  units?: number;
  animals?: number;
  squareMeters?: number;
  kilometers?: number;
  staff?: number;
}

export interface SanitizedScopeItem {
  title: string;
  description: string;
}

export interface SanitizedAnalysis {
  status: "ok";
  understood: string;
  projectBrief: string;
  kind: (typeof ALLOWED_KINDS)[number] | null;
  category: string;
  projectType: string;
  subject: string;
  heading: string;
  features: string[];
  complexity: string;
  size: (typeof projectSizes)[number]["id"] | null;
  quality: (typeof qualityOptions)[number]["id"] | null;
  quantities: SanitizedQuantities;
  locationHint: string;
  assumptions: string[];
  scope: SanitizedScopeItem[];
}

export interface SanitizedNeedsInfo {
  status: "needs_info";
  understood: string;
  questions: string[];
}

export type SanitizedAiResponse = SanitizedAnalysis | SanitizedNeedsInfo;

function capWords(value: unknown, maxWords: number, maxChars: number): string {
  const raw = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[$€£¥₹]/g, "")
    .trim()
    .slice(0, maxChars)
    .trim();
  if (!raw) return "";
  return raw.split(" ").filter(Boolean).slice(0, maxWords).join(" ");
}

export function matchAllowed(value: unknown, allowed: string[]): string | null {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return null;
  return allowed.find((item) => item.toLowerCase() === v) ?? null;
}

export function sanitizeQuantities(value: unknown): SanitizedQuantities {
  const quantities: SanitizedQuantities = {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return quantities;
  }
  const source = value as Record<string, unknown>;
  for (const key of QUANTITY_KEYS) {
    const amount = Number(source[key]);
    if (Number.isFinite(amount) && amount > 0 && amount <= 10_000_000) {
      quantities[key] = Math.round(amount * 100) / 100;
    }
  }
  return quantities;
}

function sanitizeNeedsInfo(data: unknown): SanitizedNeedsInfo | null {
  if (typeof data !== "object" || data === null) return null;
  const source = data as Record<string, unknown>;
  const understood = capWords(source.understood, 20, 200);
  const questions = Array.isArray(source.questions)
    ? source.questions
        .filter((question): question is string => typeof question === "string")
        .map((question) => capWords(question, 12, 120))
        .filter(Boolean)
        .slice(0, 2)
    : [];
  if (!understood || questions.length === 0) return null;
  return { status: "needs_info", understood, questions };
}

function sanitizeAnalysis(data: unknown): SanitizedAnalysis | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const source = data as Record<string, unknown>;

  const category =
    matchAllowed(source.category, ALLOWED_CATEGORIES) ||
    capWords(source.category, 4, 40);
  if (!category) return null;
  const projectType =
    matchAllowed(source.projectType, ALLOWED_PROJECT_TYPES) ||
    capWords(source.projectType, 6, 60);
  if (!projectType) return null;

  const heading = capWords(source.heading, 6, 120);
  if (!heading) return null;

  const allowedFeatureSet = new Set(
    ALLOWED_FEATURES.map((feature) => feature.toLowerCase()),
  );
  const requested = Array.isArray(source.features)
    ? source.features
        .filter((feature): feature is string => typeof feature === "string")
        .map((feature) => feature.trim().toLowerCase())
        .filter((feature) => allowedFeatureSet.has(feature))
    : [];
  const features = ALLOWED_FEATURES.filter((label) =>
    requested.includes(label.toLowerCase()),
  );

  const assumptions = Array.isArray(source.assumptions)
    ? source.assumptions
        .filter((item): item is string => typeof item === "string")
        .map((item) => capWords(item, 16, 120))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const scope = Array.isArray(source.scope)
    ? source.scope
        .filter(
          (item): item is Record<string, unknown> =>
            typeof item === "object" && item !== null,
        )
        .map((item) => ({
          title: capWords(item.title, 8, 80),
          description: capWords(item.description, 25, 160),
        }))
        .filter((item) => item.title)
        .slice(0, 6)
    : [];

  return {
    status: "ok",
    understood: capWords(source.understood, 20, 200),
    projectBrief: capWords(source.projectBrief, 40, 300),
    kind: ALLOWED_KINDS.find((kind) => kind === source.kind) ?? null,
    category,
    projectType,
    subject: capWords(source.subject, 3, 80),
    heading,
    features,
    complexity: ALLOWED_COMPLEXITY.includes(String(source.complexity))
      ? String(source.complexity)
      : "Standard",
    size: ALLOWED_SIZES.find((size) => size === source.size) ?? null,
    quality:
      ALLOWED_QUALITIES.find((quality) => quality === source.quality) ?? null,
    quantities: sanitizeQuantities(source.quantities),
    locationHint: capWords(source.locationHint, 4, 60),
    assumptions,
    scope,
  };
}

/**
 * Parses and validates the model's JSON. Returns null when the answer is
 * malformed or missing required fields (the caller falls back to the rule
 * extractor). Unknown fields — including any price the model tried to add —
 * are discarded.
 */
export function sanitizeAiResponse(raw: string): SanitizedAiResponse | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  if ((data as Record<string, unknown>).status === "needs_info") {
    return sanitizeNeedsInfo(data);
  }
  return sanitizeAnalysis(data);
}

/**
 * Resolves the client's location to a known city label. Only a real id or an
 * exact "<city>, <country>" / city / country name is accepted, so arbitrary
 * client text is never forwarded to the model as a location.
 */
export function resolveKnownLocation(
  locationId: unknown,
  locationText: unknown,
): string {
  const id = typeof locationId === "string" ? locationId.trim() : "";
  if (id) {
    const byId = locations.find((location) => location.id === id);
    if (byId) {
      return `${byId.city}, ${byId.country}`;
    }
  }

  const text =
    typeof locationText === "string"
      ? locationText.trim().slice(0, MAX_LOCATION_CHARS).toLowerCase()
      : "";
  if (!text) return "";

  const byLabel = locations.find(
    (location) =>
      `${location.city}, ${location.country}`.toLowerCase() === text ||
      location.city.toLowerCase() === text ||
      location.country.toLowerCase() === text,
  );
  return byLabel ? `${byLabel.city}, ${byLabel.country}` : "";
}
