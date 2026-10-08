// Client-side helper for the optional AI analysis step (POST /api/analyze).
// - Never touches GROQ_API_KEY and never calls Groq directly; only our route.
// - Caches results by normalized text (module-level Map + localStorage with a
//   versioned key, max 50 entries, 24h expiry) so the same input never calls
//   the API twice.
// - Any failure (network, 10s timeout, non-200, invalid JSON) resolves to null
//   so callers silently fall back to the rule-based analyzeProject().

export interface AiCostComponent {
  name: string;
  cost: number;
  percentage: number;
  note: string;
}

// The AI's own real-world market price range for the user's location, in USD,
// BEFORE the contingency and taxes we add on top. Never taken from the preset
// category ranges — those are not even sent to the model.
export interface AiPricing {
  low: number;
  typical: number;
  high: number;
}

export type AiTimelineUnit = "weeks" | "months" | "years";

// Realistic calendar duration for the project type the AI chose: months or
// years for physical builds, weeks or months for software and services.
export interface AiDuration {
  min: number;
  max: number;
  unit: AiTimelineUnit;
}

export type AiProjectKind = "physical" | "software" | "service";

import type { ScopeItem } from "@/types";

export interface AiAnalysisPayload {
  category: string;
  projectType: string;
  subject: string;
  heading: string;
  features: string[];
  complexity: string;
  confidence: number;
  assumptions?: string[];
  components?: AiCostComponent[];
  scope?: ScopeItem[];
  kind?: AiProjectKind;
  pricing?: AiPricing;
  duration?: AiDuration;
  source?: "ai" | "fallback";
  model?: string | null;
}

const CACHE_KEY = "costcalc-ai-analysis-v4";
const CACHE_MAX_ENTRIES = 50;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
// The server may re-ask the model once when a physical project comes back
// priced implausibly low, so allow for two model round-trips.
const REQUEST_TIMEOUT_MS = 40000;

interface CacheEntry {
  savedAt: number;
  payload: AiAnalysisPayload;
}

const memoryCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AiAnalysisPayload | null>>();
let storageLoaded = false;

export function normalizeDescriptionText(text: string): string {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function isValidComponent(value: unknown): value is AiCostComponent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AiCostComponent>;
  return (
    typeof v.name === "string" &&
    typeof v.cost === "number" &&
    Number.isFinite(v.cost) &&
    typeof v.percentage === "number" &&
    Number.isFinite(v.percentage) &&
    typeof v.note === "string"
  );
}

function isValidScopeItem(value: unknown): value is ScopeItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<ScopeItem>;
  return (
    typeof v.title === "string" &&
    (v.description === undefined || typeof v.description === "string")
  );
}

const AI_KINDS: AiProjectKind[] = ["physical", "software", "service"];
const AI_TIMELINE_UNITS: AiTimelineUnit[] = ["weeks", "months", "years"];

// Accepts the model's low/typical/high triple, fixing only an out-of-order
// range so the UI can never show low > high.
function sanitizePricing(value: unknown): AiPricing | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const v = value as Partial<AiPricing>;
  const low = Number(v.low);
  const typical = Number(v.typical);
  const high = Number(v.high);
  if (![low, typical, high].every((n) => Number.isFinite(n) && n > 0)) {
    return undefined;
  }
  return { low: Math.min(low, typical), typical, high: Math.max(high, typical) };
}

function sanitizeDuration(value: unknown): AiDuration | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const v = value as Partial<AiDuration>;
  let min = Math.round(Number(v.min));
  let max = Math.round(Number(v.max));
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
    return undefined;
  }
  if (min > max) [min, max] = [max, min];
  const unit = AI_TIMELINE_UNITS.includes(v.unit as AiTimelineUnit)
    ? (v.unit as AiTimelineUnit)
    : "weeks";
  return { min, max, unit };
}

function isValidPayload(value: unknown): value is AiAnalysisPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AiAnalysisPayload>;
  // The server may send explicit nulls for the optional AI-only fields.
  const raw = value as Record<string, unknown>;
  const kindOk =
    raw.kind === undefined ||
    raw.kind === null ||
    (typeof raw.kind === "string" && AI_KINDS.includes(raw.kind as AiProjectKind));
  const pricingOk =
    raw.pricing === undefined ||
    raw.pricing === null ||
    sanitizePricing(raw.pricing) !== undefined;
  const durationOk =
    raw.duration === undefined ||
    raw.duration === null ||
    sanitizeDuration(raw.duration) !== undefined;
  return (
    typeof v.category === "string" &&
    typeof v.projectType === "string" &&
    typeof v.subject === "string" &&
    typeof v.heading === "string" &&
    Array.isArray(v.features) &&
    v.features.every((feature) => typeof feature === "string") &&
    typeof v.complexity === "string" &&
    typeof v.confidence === "number" &&
    Number.isFinite(v.confidence) &&
    (v.components === undefined ||
      (Array.isArray(v.components) && v.components.every(isValidComponent))) &&
    (v.assumptions === undefined ||
      (Array.isArray(v.assumptions) &&
        v.assumptions.every((a) => typeof a === "string"))) &&
    (v.scope === undefined ||
      (Array.isArray(v.scope) && v.scope.every(isValidScopeItem))) &&
    kindOk &&
    pricingOk &&
    durationOk &&
    (v.source === undefined || v.source === "ai" || v.source === "fallback") &&
    (v.model === undefined || v.model === null || typeof v.model === "string")
  );
}

function readStorage(): void {
  if (storageLoaded || typeof window === "undefined") return;
  storageLoaded = true;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return;
    const now = Date.now();
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (typeof value !== "object" || value === null) continue;
      const entry = value as Partial<CacheEntry>;
      if (
        typeof entry.savedAt === "number" &&
        now - entry.savedAt <= CACHE_TTL_MS &&
        isValidPayload(entry.payload)
      ) {
        memoryCache.set(key, {
          savedAt: entry.savedAt,
          payload: entry.payload,
        });
      }
    }
  } catch {
    // Corrupted or unavailable storage — the memory cache still works.
  }
}

function writeStorage(): void {
  if (typeof window === "undefined") return;
  try {
    pruneCache();
    const data: Record<string, CacheEntry> = {};
    for (const [key, entry] of memoryCache) {
      data[key] = entry;
    }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable (private mode, quota) — cache stays in memory.
  }
}

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (now - entry.savedAt > CACHE_TTL_MS) {
      memoryCache.delete(key);
    }
  }
  while (memoryCache.size > CACHE_MAX_ENTRIES) {
    const oldest = [...memoryCache.entries()].sort(
      (a, b) => a[1].savedAt - b[1].savedAt,
    )[0];
    if (!oldest) break;
    memoryCache.delete(oldest[0]);
  }
}

// Cache key includes the location: the AI prices the project at real-world
// market cost for the user's location, so the same words in another country
// must produce a different (not cached) analysis.
function cacheKey(
  description: string,
  locationId?: string | null,
): string | null {
  const text = normalizeDescriptionText(description);
  if (!text) return null;
  return `${String(locationId ?? "").trim().toLowerCase()}|${text}`;
}

export function getCachedAiAnalysis(
  description: string,
  locationId?: string | null,
): AiAnalysisPayload | null {
  readStorage();
  const key = cacheKey(description, locationId);
  if (!key) return null;
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
    memoryCache.delete(key);
    writeStorage();
    return null;
  }
  return entry.payload;
}

export async function fetchAiAnalysis(
  description: string,
  locationId?: string | null,
): Promise<AiAnalysisPayload | null> {
  const key = cacheKey(description, locationId);
  if (!key) return null;

  const cached = getCachedAiAnalysis(description, locationId);
  if (cached) return cached;

  // Same input already in flight — share it instead of calling the API twice.
  const pending = inflight.get(key);
  if (pending) return pending;

  const request = (async (): Promise<AiAnalysisPayload | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          ...(locationId ? { locationId } : {}),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        console.warn(`[aiAnalysis] /api/analyze failed: HTTP ${res.status}`);
        return null;
      }
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        console.warn("[aiAnalysis] /api/analyze returned a non-JSON response");
        return null;
      }
      const data: unknown = await res.json();
      if (!isValidPayload(data)) {
        console.warn("[aiAnalysis] /api/analyze returned an invalid payload");
        return null;
      }
      const payload: AiAnalysisPayload = {
        category: data.category,
        projectType: data.projectType,
        subject: data.subject,
        heading: data.heading,
        features: data.features,
        complexity: data.complexity,
        confidence: Math.min(1, Math.max(0, data.confidence)),
        ...(Array.isArray(data.components)
          ? { components: data.components }
          : {}),
        ...(Array.isArray(data.scope)
          ? {
              scope: data.scope.map((item) => ({
                title: item.title,
                description:
                  typeof item.description === "string" ? item.description : "",
              })),
            }
          : {}),
        ...(data.source === "ai" || data.source === "fallback"
          ? { source: data.source }
          : {}),
        ...(Array.isArray(data.assumptions)
          ? {
              assumptions: data.assumptions.filter(
                (a): a is string => typeof a === "string",
              ),
            }
          : {}),
        ...(typeof data.model === "string" || data.model === null
          ? { model: data.model }
          : {}),
        ...(typeof data.kind === "string" &&
        AI_KINDS.includes(data.kind as AiProjectKind)
          ? { kind: data.kind as AiProjectKind }
          : {}),
        // The AI's own real-world price range and timeline (sanitized again
        // here because the stored payload may predate the current schema).
        ...(sanitizePricing(data.pricing)
          ? { pricing: sanitizePricing(data.pricing) as AiPricing }
          : {}),
        ...(sanitizeDuration(data.duration)
          ? { duration: sanitizeDuration(data.duration) as AiDuration }
          : {}),
      };
      // Only cache real AI results. Fallbacks are returned to the caller
      // but NOT cached, so the AI is retried on the next attempt.
      if (data.source !== "fallback") {
        memoryCache.set(key, { savedAt: Date.now(), payload });
        writeStorage();
      }
      return payload;
    } catch (err) {
      // Network error, timeout or abort — rule-based fallback. The real
      // reason is surfaced in the console so the failure is diagnosable.
      console.warn(
        "[aiAnalysis] request failed:",
        err instanceof Error ? err.message : String(err),
      );
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}
