// Short-lived HMAC token for the two-phase analyzer.
//
// `phase: "prepare"` sends the model's sanitized extraction back to the client
// together with a signed token. `phase: "estimate"` verifies that token and
// reuses the extraction instead of asking the model to analyze the same
// description a second time. The token is bound to the description, category
// and pricing location, so it cannot be replayed for a different project.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { SanitizedAnalysis } from "@/lib/analysisSchema";

const TOKEN_VERSION = 1;
const DEFAULT_TTL_MS = 15 * 60 * 1000;
export const MAX_ANALYSIS_TOKEN_CHARS = 20_000;

export interface PreparedAnalysis {
  analysis: SanitizedAnalysis;
  model: string | null;
}

interface AnalysisTokenPayload extends PreparedAnalysis {
  v: number;
  exp: number;
  ctx: string;
}

function signingSecret(): string | null {
  const secret =
    process.env.ANALYSIS_TOKEN_SECRET?.trim() ||
    process.env.GROQ_API_KEY?.trim() ||
    "";
  return secret || null;
}

/** Stable fingerprint of the inputs the prepared analysis belongs to. */
export function analysisContext(
  description: string,
  categoryId: string,
  locationId: string,
): string {
  return createHash("sha256")
    .update(`${description}\u0000${categoryId}\u0000${locationId}`)
    .digest("base64url");
}

function sign(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

/** Signs a prepared analysis, or returns null when no secret is configured. */
export function createAnalysisToken(
  context: string,
  analysis: SanitizedAnalysis,
  model: string | null,
  ttlMs = DEFAULT_TTL_MS,
): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const payload: AnalysisTokenPayload = {
    v: TOKEN_VERSION,
    exp: Date.now() + ttlMs,
    ctx: context,
    analysis,
    model,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${encoded}.${sign(encoded, secret)}`;
}

/**
 * Verifies a token for the current request context. Returns null for a
 * missing, malformed, tampered, expired or mismatched token; callers then
 * fall back to a fresh model call.
 */
export function verifyAnalysisToken(
  token: unknown,
  context: string,
): PreparedAnalysis | null {
  if (typeof token !== "string" || token.length > MAX_ANALYSIS_TOKEN_CHARS) {
    return null;
  }
  const secret = signingSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = sign(encoded, secret);
  const givenBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (
    givenBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(givenBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (record.v !== TOKEN_VERSION || record.ctx !== context) return null;
  if (
    typeof record.exp !== "number" ||
    !Number.isFinite(record.exp) ||
    record.exp <= Date.now()
  ) {
    return null;
  }

  const analysis = record.analysis;
  if (
    typeof analysis !== "object" ||
    analysis === null ||
    Array.isArray(analysis) ||
    (analysis as { status?: unknown }).status !== "ok"
  ) {
    return null;
  }

  return {
    analysis: analysis as SanitizedAnalysis,
    model: typeof record.model === "string" ? record.model : null,
  };
}
