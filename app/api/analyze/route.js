import { NextResponse } from "next/server";
import { FEATURES, PROJECT_TYPES } from "@/lib/analyzeProject";

// This project uses `output: "export"`, which does not support dynamic API
// routes. Marking the route static lets the build pass; it remains fully
// functional in `next dev` and server deployments (same pattern as
// app/api/estimates/route.ts).
export const dynamic = "force-static";

const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 5000;
const MAX_INPUT_CHARS = 500;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Allowed values come from the SAME static config the client prices with
// (lib/analyzeProject.js). The AI only picks labels from these lists.
const ALLOWED_CATEGORIES = Array.from(
  new Set(PROJECT_TYPES.map((type) => type.category)),
);
const ALLOWED_PROJECT_TYPES = PROJECT_TYPES.map((type) => type.projectType);
const ALLOWED_FEATURES = FEATURES.map((feature) => feature.label);
const ALLOWED_COMPLEXITY = ["Basic", "Standard", "Advanced"];

// Basic per-IP rate limiter: 10 requests per minute, in-memory.
const rateBuckets = new Map();

function jsonError(error, status) {
  return NextResponse.json({ error }, { status });
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    // Opportunistic cleanup of expired buckets.
    if (rateBuckets.size > 1000) {
      for (const [key, value] of rateBuckets) {
        if (now >= value.resetAt) rateBuckets.delete(key);
      }
    }
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function matchAllowed(value, allowed) {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return null;
  return allowed.find((item) => item.toLowerCase() === v) || null;
}

function capWords(value, maxWords, maxChars) {
  const raw = String(value ?? "")
    .replace(/\s+/g, " ")
    // Safety net: the prompt forbids prices/numbers; strip stray currency
    // symbols so no AI output can ever look like a price in the UI.
    .replace(/[$€£¥₹]/g, "")
    .trim()
    .slice(0, maxChars)
    .trim();
  if (!raw) return "";
  return raw.split(" ").filter(Boolean).slice(0, maxWords).join(" ");
}

function buildSystemPrompt() {
  return [
    "You classify project descriptions for a development-agency cost estimator.",
    "Return ONLY a valid JSON object with exactly these keys and nothing else:",
    '{ "category": string, "projectType": string, "subject": string, "heading": string, "features": string[], "complexity": string, "confidence": number }',
    "",
    `category must be exactly one of: ${ALLOWED_CATEGORIES.join(" | ")}`,
    `projectType must be exactly one of: ${ALLOWED_PROJECT_TYPES.join(" | ")}`,
    `features may only contain values from this list (use [] if none apply): ${ALLOWED_FEATURES.join(" | ")}`,
    "complexity must be exactly one of: Basic | Standard | Advanced",
    "confidence is a number between 0 and 1",
    "",
    "subject: what the project is FOR, max 3 words, Title Case, no verbs.",
    'heading: max 6 words, formatted as "<Project type> for <Subject>".',
    "The description often contains typos; infer the intended meaning.",
    "NEVER output prices, numbers or currency of any kind.",
  ].join("\n");
}

async function callGroq(apiKey, description) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: description },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(
        `[api/analyze] Groq responded ${res.status} for model ${MODEL}`,
      );
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (err) {
    console.error(
      "[api/analyze] Groq request failed:",
      err?.name === "AbortError" ? "timed out after 5000ms" : err?.message || err,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Validates and sanitizes the model output. Returns null for invalid output
// (-> 502 bad_ai_output); everything that passes is safe, config-list-bound.
function sanitizeAiOutput(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }

  const category = matchAllowed(data.category, ALLOWED_CATEGORIES);
  if (!category) return null;
  const projectType = matchAllowed(data.projectType, ALLOWED_PROJECT_TYPES);
  if (!projectType) return null;

  const allowedFeatureSet = new Set(ALLOWED_FEATURES.map((f) => f.toLowerCase()));
  const features = Array.isArray(data.features)
    ? data.features
        .filter((f) => typeof f === "string")
        .map((f) => f.trim().toLowerCase())
        .filter((f) => allowedFeatureSet.has(f))
    : [];
  const canonicalFeatures = ALLOWED_FEATURES.filter((label) =>
    features.includes(label.toLowerCase()),
  );

  const subject = capWords(data.subject, 3, 80);
  const heading = capWords(data.heading, 6, 120);
  const complexity = ALLOWED_COMPLEXITY.includes(data.complexity)
    ? data.complexity
    : "Standard";
  let confidence = Number(data.confidence);
  if (!Number.isFinite(confidence)) confidence = 0.5;
  confidence = Math.min(1, Math.max(0, confidence));

  return {
    category,
    projectType,
    subject,
    heading,
    features: canonicalFeatures,
    complexity,
    confidence,
  };
}

export async function POST(request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return jsonError("Too many requests. Please slow down.", 429);
  }

  let description = "";
  try {
    const body = await request.json();
    if (typeof body?.description === "string") {
      description = body.description.trim().slice(0, MAX_INPUT_CHARS);
    }
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  if (!description) {
    return jsonError("A project description is required.", 400);
  }

  // Server-only secret. Never NEXT_PUBLIC_, never used from client code.
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError("ai_unavailable", 503);
  }

  const raw = await callGroq(apiKey, description);
  if (raw === null) {
    return jsonError("ai_request_failed", 502);
  }

  const sanitized = sanitizeAiOutput(raw);
  if (!sanitized) {
    console.error("[api/analyze] Invalid model output:", String(raw).slice(0, 300));
    return jsonError("bad_ai_output", 502);
  }

  return NextResponse.json(sanitized);
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
