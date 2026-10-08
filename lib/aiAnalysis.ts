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
  source?: "ai" | "fallback";
  model?: string | null;
}

const CACHE_KEY = "costcalc-ai-analysis-v3";
const CACHE_MAX_ENTRIES = 50;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const REQUEST_TIMEOUT_MS = 25000;

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

function isValidPayload(value: unknown): value is AiAnalysisPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AiAnalysisPayload>;
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

export function getCachedAiAnalysis(
  description: string,
): AiAnalysisPayload | null {
  readStorage();
  const key = normalizeDescriptionText(description);
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
): Promise<AiAnalysisPayload | null> {
  const key = normalizeDescriptionText(description);
  if (!key) return null;

  const cached = getCachedAiAnalysis(description);
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
        body: JSON.stringify({ description }),
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
