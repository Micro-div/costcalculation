// Server-side storage for shared estimates.
//
// A share link carries ONLY the estimate id; the exact estimate that was
// computed (including its totals and prices) is stored here. Opening a link
// therefore shows the same numbers that were shared, even if rate cards change
// later.
//
// Uses Upstash Redis when configured (production), otherwise an in-memory
// store so local development still works.

import type { EstimateResult } from "@/types";
import { isValidEstimateData } from "@/lib/estimateValidation";
import {
  isUpstashConfigured,
  warnIfUpstashMissingInProduction,
} from "@/lib/upstashConfig";

export { isValidEstimateData as isStorableEstimate } from "@/lib/estimateValidation";

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const KEY_PREFIX = "costcalc:estimate:";
const MAX_ESTIMATE_JSON_BYTES = 200_000;
export const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

interface StoredRecord {
  id: string;
  estimate: EstimateResult;
  createdAt: string;
}

const memoryStore = new Map<string, StoredRecord>();
const globalStore = globalThis as typeof globalThis & {
  __costcalcEstimateStore?: Map<string, StoredRecord>;
};
const store = globalStore.__costcalcEstimateStore ?? memoryStore;
globalStore.__costcalcEstimateStore = store;

async function upstash(command: Array<string | number>): Promise<unknown> {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

export function isValidShareId(value: unknown): value is string {
  return typeof value === "string" && SHARE_ID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function newShareId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `est-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function isExpired(record: StoredRecord): boolean {
  const createdAt = Date.parse(record.createdAt);
  if (!Number.isFinite(createdAt)) return true;
  return Date.now() - createdAt > SHARE_TTL_SECONDS * 1000;
}

/** Persists an estimate and returns its share id, or null on failure. */
export async function saveEstimate(
  estimate: EstimateResult,
): Promise<string | null> {
  if (!isValidEstimateData(estimate)) return null;

  const record: StoredRecord = {
    id: newShareId(),
    estimate,
    createdAt: new Date().toISOString(),
  };

  const serialized = JSON.stringify(record);
  if (serialized.length > MAX_ESTIMATE_JSON_BYTES) return null;

  if (isUpstashConfigured()) {
    try {
      await upstash([
        "SET",
        `${KEY_PREFIX}${record.id}`,
        serialized,
        "EX",
        SHARE_TTL_SECONDS,
      ]);
      return record.id;
    } catch (error) {
      console.error(
        "[estimateStore] Upstash write failed:",
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  warnIfUpstashMissingInProduction();
  if (store.size > 500) {
    for (const [storedId, stored] of store) {
      if (isExpired(stored)) store.delete(storedId);
    }
  }
  store.set(record.id, record);
  return record.id;
}

/** Loads a stored estimate by share id, or null when unknown/expired. */
export async function getStoredEstimate(
  id: string,
): Promise<EstimateResult | null> {
  if (!isValidShareId(id)) return null;

  if (isUpstashConfigured()) {
    try {
      const raw = await upstash(["GET", `${KEY_PREFIX}${id}`]);
      if (typeof raw !== "string") return null;
      const parsed: unknown = JSON.parse(raw);
      if (isRecord(parsed) && isValidEstimateData(parsed.estimate)) {
        return parsed.estimate;
      }
      return null;
    } catch (error) {
      console.error(
        "[estimateStore] Upstash read failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  warnIfUpstashMissingInProduction();
  const record = store.get(id);
  if (!record) return null;
  if (isExpired(record)) {
    store.delete(id);
    return null;
  }
  return isValidEstimateData(record.estimate) ? record.estimate : null;
}
