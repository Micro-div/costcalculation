// Client-side helper for the optional AI analysis step (POST /api/analyze).
// - Never touches GROQ_API_KEY and never calls Groq directly; only our route.
// - Caches results by normalized text (module-level Map + localStorage with a
//   versioned key, max 50 entries, 24h expiry) so the same input never calls
//   the API twice.
// - Any failure (network, 6s timeout, non-200, invalid JSON) resolves to null
//   so callers silently fall back to the rule-based analyzeProject().

export interface AiAnalysisPayload {
  category: string;
  projectType: string;
  subject: string;
  heading: string;
  features: string[];
  complexity: string;
  confidence: number;
}

const CACHE_KEY = "costcalc-ai-analysis-v1";
const CACHE_MAX_ENTRIES = 50;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const REQUEST_TIMEOUT_MS = 6000;

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
    Number.isFinite(v.confidence)
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
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) return null;
      const data: unknown = await res.json();
      if (!isValidPayload(data)) return null;
      const payload: AiAnalysisPayload = {
        category: data.category,
        projectType: data.projectType,
        subject: data.subject,
        heading: data.heading,
        features: data.features,
        complexity: data.complexity,
        confidence: Math.min(1, Math.max(0, data.confidence)),
      };
      memoryCache.set(key, { savedAt: Date.now(), payload });
      writeStorage();
      return payload;
    } catch {
      // Network error, timeout or abort — silent rule-based fallback.
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}
