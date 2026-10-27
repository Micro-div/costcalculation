import {
  isUpstashConfigured,
  warnIfUpstashMissingInProduction,
} from "@/lib/upstashConfig";

// Shared rate limiter for the Groq-backed routes.
//
// Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are configured, so the limit holds across server
// instances. Otherwise it falls back to a process-local bucket (fine for local
// development and single-instance deployments).
//
// The bucket key comes from `x-real-ip` ONLY. `x-forwarded-for` is trivially
// spoofed by clients and must never be trusted for limiting.

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

// Survive dev hot reloads by reusing a global map.
const globalStore = globalThis as typeof globalThis & {
  __costcalcRateBuckets?: Map<string, { count: number; resetAt: number }>;
};
const buckets = globalStore.__costcalcRateBuckets ?? memoryBuckets;
globalStore.__costcalcRateBuckets = buckets;

const INCREMENT_WITH_EXPIRY = [
  "local count = redis.call('INCR', KEYS[1])",
  "local ttl = redis.call('PTTL', KEYS[1])",
  "if count == 1 or ttl < 0 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
  "return count",
].join("; ");

async function upstash(command: Array<string | number>): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL as string;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN as string;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash responded ${res.status}`);
  }
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

function memoryLimited(
  key: string,
  max: number,
  windowMs: number,
): { limited: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size > 1000) {
      for (const [bucketKey, value] of buckets) {
        if (now >= value.resetAt) buckets.delete(bucketKey);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: max - 1 };
  }
  bucket.count += 1;
  return {
    limited: bucket.count > max,
    remaining: Math.max(0, max - bucket.count),
  };
}

export interface RateLimitOptions {
  max: number;
  windowMs: number;
  /** Prefix so different routes get independent buckets. */
  scope: string;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
}

/** Uses only `x-real-ip`; unknown clients share one conservative bucket. */
export function clientKey(request: Request): string {
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = `costcalc:${options.scope}:${clientKey(request)}`;

  if (isUpstashConfigured()) {
    try {
      const count = Number(
        await upstash([
          "EVAL",
          INCREMENT_WITH_EXPIRY,
          1,
          key,
          options.windowMs,
        ]),
      );
      if (!Number.isFinite(count)) throw new Error("invalid counter");
      return {
        limited: count > options.max,
        remaining: Math.max(0, options.max - count),
      };
    } catch (error) {
      console.error(
        "[rateLimit] Upstash unavailable, using memory fallback:",
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    warnIfUpstashMissingInProduction();
  }

  return memoryLimited(key, options.max, options.windowMs);
}
