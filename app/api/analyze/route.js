import { NextResponse } from "next/server";
import {
  analyzeProject,
  FEATURES,
  PROJECT_TYPES,
} from "@/lib/analyzeProject";

export const dynamic = "force-dynamic";

// Dynamic server route: runs on Vercel / any Node server. Requires the
// GROQ_API_KEY environment variable (set it in Vercel → Settings →
// Environment Variables, or in .env.local for local development).
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
// Models known to be available on Groq's current free/standard keys. Used
// ONLY as a fallback when the configured model is unavailable (for example a
// stale GROQ_MODEL saved in the Vercel dashboard), so the AI keeps working.
const MODEL_FALLBACKS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const MODEL_CANDIDATES = Array.from(new Set([MODEL, ...MODEL_FALLBACKS]));
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 20000;
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
    "You classify project descriptions for a cost estimator used by a digital and physical services agency.",
    "Work in two steps: (1) Read the ENTIRE description and decide what the project ACTUALLY is — its real-world type, audience and deliverables. Do not classify by matching a single keyword. (2) Choose the category, projectType, cost split and scope for that project.",
    "Physical and non-software projects are valid: car showrooms, shop or restaurant fit-outs, office renovations, construction work, event spaces, branding, marketing campaigns. A physical showroom or shop floor is NOT an e-commerce store — classify as E-commerce only when the user explicitly wants to sell online.",
    "Return ONLY a valid JSON object with exactly these keys and nothing else:",
    '{ "category": string, "projectType": string, "subject": string, "heading": string, "features": string[], "complexity": string, "confidence": number, "assumptions": string[], "components": [{"name": string, "cost": number, "percentage": number, "note": string}], "scope": [{"title": string, "description": string}] }',
    "",
    `category: if the project clearly matches one of: ${ALLOWED_CATEGORIES.join(" | ")}, use that exact value. Otherwise invent a short category (max 3 words) that fits, e.g. "Interior & Fit-Out".`,
    `projectType: if the project clearly matches one of: ${ALLOWED_PROJECT_TYPES.join(" | ")}, use that exact value. Otherwise invent a precise short label, e.g. "Car Showroom Fit-Out".`,
    `features may only contain values from this list (use [] if none apply): ${ALLOWED_FEATURES.join(" | ")}`,
    "complexity must be exactly one of: Basic | Standard | Advanced",
    "confidence is a number between 0 and 1",
    'assumptions: 2-5 short, project-specific assumptions that shape the estimate (site access, permits, materials, content readiness...). No prices, numbers or currency.',
    'components: 5-8 cost items tailored to THIS project type; add categories that fit the description. For a physical project use items like Interior Design, Renovation & Construction, Labour, Furniture & Fixtures, Lighting & Signage, Permits & Licenses, Website & Online Presence, Project Management. For software use items like UI/UX Design, Frontend Development, Backend Development, Testing & QA, Hosting & Infrastructure, Third-party Tools, Project Management. Each item has: name (short label), cost (rough USD share, digits only, no currency symbols), percentage (this item share of the total, 0-100), note (a short 3-8 word explanation). The costs should add up to a plausible project total and the percentages MUST add up to 100 — the client rescales the split to the computed total for the user location and complexity.',
    'scope: one deliverable per main component (4-6 items). Each item: title (max ~5 words) and description (a short 2-line explanation, max ~25 words, of what is included — key screens, features or integrations).',
    "",
    "subject: what the project is FOR, max 3 words, Title Case, no verbs.",
    'heading: max 6 words, a short title for the whole project (e.g. "E-commerce Store for Tuc Shop" or "Car Showroom Fit-Out").',
    "The description often contains typos; infer the intended meaning.",
    'In "components" costs and percentages describe the cost split; everywhere else NEVER output prices, numbers or currency of any kind.',
    "",
    'Example (PHYSICAL project): input "i want to build a physical car showroom with interior design, renovation and signage" -> {"category":"Interior & Fit-Out","projectType":"Car Showroom Fit-Out","subject":"Car Showroom","heading":"Car Showroom Fit-Out","features":[],"complexity":"Standard","confidence":0.85,"assumptions":["Property is handed over empty and ready for fit-out","Local permits are required before work starts","Vehicle stocking and staffing are out of scope"],"components":[{"name":"Interior Design","cost":2000,"percentage":20,"note":"Layout, mood and material choices"},{"name":"Renovation & Construction","cost":3000,"percentage":30,"note":"Structural works and finishing"},{"name":"Labour","cost":1600,"percentage":16,"note":"Skilled on-site crew"},{"name":"Furniture & Fixtures","cost":1300,"percentage":13,"note":"Display stands and seating"},{"name":"Lighting & Signage","cost":900,"percentage":9,"note":"Showroom lights and brand signs"},{"name":"Permits & Licenses","cost":500,"percentage":5,"note":"Local approvals and fees"},{"name":"Website & Online Presence","cost":400,"percentage":4,"note":"Simple site and listings"},{"name":"Project Management","cost":300,"percentage":3,"note":"Scheduling and supervision"}],"scope":[{"title":"Interior design concept","description":"Layout plans and material boards for the showroom floor."},{"title":"Renovation works","description":"Wall, flooring and ceiling work by the construction crew."},{"title":"Lighting & signage install","description":"Brand signage, showroom lighting and wayfinding fitted."},{"title":"Website & listings","description":"Simple website with vehicle listings and contact details."}]}',
    'Example (SOFTWARE project): input "here i nned to make a tuc shop with online payment" -> {"category":"E-commerce","projectType":"E-commerce Store","subject":"Tuc Shop","heading":"E-commerce Store for Tuc Shop","features":["Online payment"],"complexity":"Standard","confidence":0.9,"assumptions":["You provide product photos and prices","Payment gateway account is set up by you"],"components":[{"name":"UI/UX Design","cost":1500,"percentage":15,"note":"Storefront wireframes and styling"},{"name":"Frontend Development","cost":3000,"percentage":30,"note":"Product listing and checkout pages"},{"name":"Backend Development","cost":2500,"percentage":25,"note":"Orders, cart and payment API"},{"name":"Testing & QA","cost":1000,"percentage":10,"note":"Checkout and payment checks"},{"name":"Hosting & Infrastructure","cost":1000,"percentage":10,"note":"First year of hosting"},{"name":"Project Management","cost":1000,"percentage":10,"note":"Coordination and delivery"}],"scope":[{"title":"Product catalog","description":"Categories, variants and product detail pages for the full inventory."},{"title":"Secure payment integration","description":"Card and wallet checkout through a PCI-compliant payment gateway."},{"title":"Order management","description":"Cart, checkout and order tracking screens for customers."},{"title":"Admin dashboard","description":"Manage products, orders and stock from one dashboard."}]}',
  ].join("\n");
}

async function callGroqModel(apiKey, description, model) {
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
        model,
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
      const status = res.status;
      let code = "";
      try {
        const body = await res.json();
        code = String(body?.error?.code ?? "");
      } catch {
        // body was not JSON — keep code empty
      }
      const modelUnavailable =
        status === 404 ||
        code === "model_not_found" ||
        code === "model_decommissioned";
      console.error(
        `[api/analyze] Groq responded ${status} for model ${model}${code ? ` (${code})` : ""}`,
      );
      return { content: null, modelUnavailable, error: `HTTP ${status}${code ? ` (${code})` : ""}` };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return {
      content: typeof content === "string" ? content : null,
      modelUnavailable: false,
      error: typeof content === "string" ? null : "empty model response",
    };
  } catch (err) {
    const message = err?.name === "AbortError" ? `timed out after ${REQUEST_TIMEOUT_MS}ms` : err?.message || String(err);
    console.error("[api/analyze] Groq request failed:", message);
    // Network error or timeout: do NOT try another model (would double the
    // wait); the client falls back to the rule-based analysis.
    return { content: null, modelUnavailable: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

// Tries the configured model first, then the known-good fallbacks. A fallback
// only runs when the previous model is unavailable on the key (for example a
// stale GROQ_MODEL pointing at an old llama model), so the AI keeps working
// without doubling latency on timeouts.
async function callGroq(apiKey, description) {
  let lastError = null;
  for (const model of MODEL_CANDIDATES) {
    const { content, modelUnavailable, error } = await callGroqModel(
      apiKey,
      description,
      model,
    );
    if (content !== null) {
      if (model !== MODEL) {
        console.warn(
          `[api/analyze] Falling back to model ${model} (GROQ_MODEL=${MODEL} unavailable)`,
        );
      }
      return { content, model, error: null };
    }
    lastError = error;
    if (!modelUnavailable) return { content: null, model: null, error };
  }
  return { content: null, model: null, error: lastError };
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

  // The AI decides the project type itself: known config labels are kept
  // exactly, anything else short and safe is accepted as-is (a physical
  // showroom does not fit the software list, so we must not reject it).
  const categoryRaw = capWords(data.category, 4, 40);
  const category = matchAllowed(data.category, ALLOWED_CATEGORIES) || categoryRaw;
  if (!category) return null;
  const projectTypeRaw = capWords(data.projectType, 6, 60);
  const projectType =
    matchAllowed(data.projectType, ALLOWED_PROJECT_TYPES) || projectTypeRaw;
  if (!projectType) return null;

  const assumptions = Array.isArray(data.assumptions)
    ? data.assumptions
        .filter((a) => typeof a === "string")
        .map((a) => capWords(a, 16, 120))
        .filter(Boolean)
        .slice(0, 5)
    : [];

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

  // Cost components: keep only well-formed entries. Sums are NOT trusted
  // here — the client re-normalizes them against the computed base total.
  const components = Array.isArray(data.components)
    ? data.components
        .filter((c) => typeof c === "object" && c !== null)
        .map((c) => ({
          name: capWords(c.name, 5, 40),
          cost: Number(c.cost),
          percentage: Number(c.percentage),
          note: capWords(c.note, 10, 80),
        }))
        .filter(
          (c) =>
            c.name &&
            Number.isFinite(c.cost) &&
            c.cost >= 0 &&
            Number.isFinite(c.percentage) &&
            c.percentage >= 0 &&
            c.percentage <= 100,
        )
        .slice(0, 8)
    : [];

  const scope = Array.isArray(data.scope)
    ? data.scope
        .filter((s) => typeof s === "object" && s !== null)
        .map((s) => ({
          title: capWords(s.title, 8, 80),
          description: capWords(s.description, 25, 160),
        }))
        .filter((s) => s.title)
        .slice(0, 6)
    : [];

  return {
    category,
    projectType,
    subject,
    heading,
    features: canonicalFeatures,
    complexity,
    confidence,
    assumptions,
    components,
    scope,
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
  // Log presence only — never the key itself.
  const apiKey = process.env.GROQ_API_KEY;
  console.log(`[api/analyze] GROQ_API_KEY present: ${Boolean(apiKey)}`);

  const startedAt = Date.now();

  if (!apiKey) {
    console.error(
      "[api/analyze] GROQ_API_KEY is not set. Add it to .env.local (local) or your host's environment variables.",
    );
    console.log(
      `[api/analyze] source=fallback model=none responseMs=${Date.now() - startedAt} error=GROQ_API_KEY missing`,
    );
    return NextResponse.json({
      ...fallbackAnalysis(description),
      source: "fallback",
      model: null,
    });
  }

  const { content: raw, model: usedModel, error } = await callGroq(
    apiKey,
    description,
  );
  const responseMs = Date.now() - startedAt;

  if (raw === null) {
    console.error(
      `[api/analyze] Groq call failed: ${error ?? "unknown"} (model=${usedModel ?? MODEL})`,
    );
    console.log(
      `[api/analyze] source=fallback model=${usedModel ?? "none"} responseMs=${responseMs} error=${error ?? "unknown"}`,
    );
    return NextResponse.json({
      ...fallbackAnalysis(description),
      source: "fallback",
      model: null,
    });
  }

  const sanitized = sanitizeAiOutput(raw);
  if (!sanitized) {
    console.error("[api/analyze] Invalid model output:", String(raw).slice(0, 300));
    console.log(
      `[api/analyze] source=fallback model=${usedModel} responseMs=${responseMs} error=bad_ai_output`,
    );
    return NextResponse.json({
      ...fallbackAnalysis(description),
      source: "fallback",
      model: null,
    });
  }

  console.log(
    `[api/analyze] source=ai model=${usedModel} responseMs=${responseMs} error=none`,
  );
  return NextResponse.json({ ...sanitized, source: "ai", model: usedModel });
}

// Rule-based analysis used when Groq is unavailable or misbehaving, so the
// client always gets a usable, price-config-bound payload (source:fallback).
function fallbackAnalysis(description) {
  const analysis = analyzeProject(description);
  return {
    category: analysis.category,
    projectType: analysis.projectType,
    subject: analysis.subject,
    heading: analysis.heading,
    features: analysis.features,
    complexity: analysis.complexity,
    confidence: analysis.confidence,
    assumptions: analysis.assumptions,
    // Fallback must still split the cost into several generic components
    // (the client rescales their shares to the computed subtotal).
    components: [
      { name: "Design", cost: 1400, percentage: 18, note: "Visuals and planning" },
      { name: "Build", cost: 2650, percentage: 34, note: "Core delivery work" },
      { name: "Labour", cost: 1800, percentage: 23, note: "Team execution time" },
      { name: "Testing", cost: 950, percentage: 12, note: "Quality checks and fixes" },
      { name: "Management", cost: 1000, percentage: 13, note: "Coordination and delivery" },
    ],
    scope: analysis.scope,
  };
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
