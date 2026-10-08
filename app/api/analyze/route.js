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

// Label lists only — these are NAMES, never prices. No preset category price
// ranges and no software price baselines are ever sent to the model, so it
// cannot anchor its estimate on them.
const ALLOWED_CATEGORIES = Array.from(
  new Set(PROJECT_TYPES.map((type) => type.category)),
);
const ALLOWED_PROJECT_TYPES = PROJECT_TYPES.map((type) => type.projectType);
const ALLOWED_FEATURES = FEATURES.map((feature) => feature.label);
const ALLOWED_COMPLEXITY = ["Basic", "Standard", "Advanced"];
const ALLOWED_KINDS = ["physical", "software", "service"];
const ALLOWED_UNITS = ["weeks", "months", "years"];

// Where the user is pricing the project. Sent to the model so it can use
// real local market rates (labour, materials, land) instead of a flat figure.
const LOCATION_LABELS = {
  us: "United States (New York)",
  ca: "Canada (Toronto)",
  uk: "United Kingdom (London)",
  ae: "United Arab Emirates (Dubai)",
  pk: "Pakistan (Karachi)",
  in: "India (Mumbai)",
  au: "Australia (Sydney)",
  de: "Germany (Berlin)",
  sg: "Singapore",
  ng: "Nigeria (Lagos)",
};

// Sanity check: a physical project (land, construction, animals, infrastructure)
// that comes back under this USD figure — or with a timeline of a few weeks —
// was priced like a small software job. We re-ask the model exactly once with
// a note to use real-world market prices.
const PHYSICAL_MIN_TYPICAL_USD = 20000;
const PHYSICAL_SHORT_TIMELINE_MAX_WEEKS = 12;

// Keyword fallback used only when the model did not return a `kind`.
const PHYSICAL_KEYWORDS = [
  /\bacres?\b/,
  /\bzoo\b/,
  /\bwildlife\b/,
  /\banimals?\b/,
  /\blivestock\b/,
  /\bcattle\b/,
  /\benclosures?\b/,
  /\bconstruction\b/,
  /\brenovation\b/,
  /\bfit[- ]?out\b/,
  /\bland\b/,
  /\bplot\b/,
  /\bwarehouse\b/,
  /\bfactory\b/,
  /\bfarms?\b/,
  /\broads?\b/,
  /\bbridges?\b/,
  /\bbuildings?\b/,
  /\bpipelines?\b/,
  /\bsolar\b/,
  /\bstadium\b/,
  /\baquarium\b/,
  /\bpark\b/,
  /\bsite works?\b/,
  /\bsite preparation\b/,
];

// Software signals: keep a description like "a booking website for a park"
// out of the physical guess.
const SOFTWARE_KEYWORDS = [
  /\bwebsites?\b/,
  /\bweb\b/,
  /\bapps?\b/,
  /\bsoftware\b/,
  /\bsaas\b/,
  /\bdashboards?\b/,
  /\bonline (store|shop|booking)\b/,
  /\blog ?in\b/,
  /\bapi\b/,
];

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
    // Safety net: the prompt forbids prices in prose; strip stray currency
    // symbols so no AI output can ever look like a price in the UI.
    .replace(/[$€£¥₹]/g, "")
    .trim()
    .slice(0, maxChars)
    .trim();
  if (!raw) return "";
  return raw.split(" ").filter(Boolean).slice(0, maxWords).join(" ");
}

function locationLabel(locationId) {
  return LOCATION_LABELS[String(locationId ?? "").trim().toLowerCase()] || "";
}

function buildSystemPrompt(userLocation) {
  const where = userLocation
    ? `The user's location for pricing: ${userLocation}. Price at that market's real rates (labour, materials, land, permits) and report amounts in USD.`
    : "No location was given — price at United States market rates and report amounts in USD.";
  return [
    "You classify AND price project descriptions for a cost estimator used by a digital and physical services agency.",
    "Work in two steps: (1) Read the ENTIRE description and decide what the project ACTUALLY is — its real-world type, quantities and deliverables. Do not classify by matching a single keyword. (2) Choose the kind, category, projectType, cost breakdown, price range, timeline and scope for that project.",
    "",
    "PRICING RULES",
    "Price the project at real-world market cost for the user's location. Physical, construction, land and infrastructure projects typically cost tens of thousands to millions of dollars. Never scale down to fit a small budget. Use the quantities the user gave (acres, animals, floors, rooms, staff) as the main cost drivers.",
    where,
    "No preset price ranges, category budgets or software price baselines are sent to you on purpose. Never assume or anchor on a small budget, and never price a physical project at software prices.",
    "Physical and non-software projects are valid and common: zoos and wildlife parks, farms, land development, construction, roads and infrastructure, warehouses, factories, restaurants, shops, car showrooms, offices and fit-outs, events and venues. A physical showroom or shop floor is NOT an e-commerce store — use E-commerce only when the user explicitly wants to sell online.",
    "",
    "Return ONLY a valid JSON object with exactly these keys and nothing else:",
    '{ "kind": string, "category": string, "projectType": string, "subject": string, "heading": string, "features": string[], "complexity": string, "confidence": number, "assumptions": string[], "pricing": {"low": number, "typical": number, "high": number}, "duration": {"min": number, "max": number, "unit": string}, "components": [{"name": string, "cost": number, "percentage": number, "note": string}], "scope": [{"title": string, "description": string}] }',
    "",
    `kind: exactly one of ${ALLOWED_KINDS.join(" | ")} — "physical" for anything built on land (construction, infrastructure, venues, land, animals, utilities), "software" for code, apps and websites, "service" for design, branding, marketing and campaigns.`,
    `category: describe the project in your own short words (max 4 words), e.g. "Zoo / Wildlife Park", "Interior & Fit-Out", "Road Construction". Only use one of these common labels if it clearly matches: ${ALLOWED_CATEGORIES.join(" | ")}.`,
    `projectType: your precise label for this exact project (max 6 words), e.g. "Zoo / Wildlife Park Development". Only use one of these generic labels when it clearly matches: ${ALLOWED_PROJECT_TYPES.join(" | ")}.`,
    `features may only contain values from this list (use [] for physical projects): ${ALLOWED_FEATURES.join(" | ")}`,
    "complexity must be exactly one of: Basic | Standard | Advanced",
    "confidence is a number between 0 and 1",
    'pricing: the real-world market cost for this location, in USD, EXCLUDING government tax/VAT and excluding the 5% contingency added on top. low = realistic best case, typical = the single best estimate, high = realistic upper end, with low <= typical <= high. Physical, land and infrastructure projects usually run into the tens of thousands to millions of dollars.',
    "duration: realistic calendar time for THIS project type. Physical builds take months or years (never weeks: a zoo, road, building, farm or fit-out takes months to years). Software takes weeks or months. Services take weeks or months. min <= max and unit is exactly one of: weeks | months | years.",
    "components: 5-12 cost items tailored to THIS project type, with REAL USD amounts that add up to pricing.typical. Each item: name (short label), cost (USD amount, digits only, no currency symbols), percentage (this item's share of the total, 0-100, all together MUST add up to 100), note (a short 3-8 word explanation).",
    'For a ZOO or WILDLIFE PARK you MUST include these components with realistic amounts for the given location and acreage/animal count: land/site preparation, enclosures & habitats, animal acquisition & transport, veterinary facility, staff & labour, utilities, visitor facilities, permits & licenses, security, landscaping and marketing.',
    "For construction, land or fit-out projects use items like Land & Site Preparation, Construction & Materials, Labour, Fixtures & Equipment, Utilities, Permits & Licenses, Security, Marketing. For software use items like UI/UX Design, Frontend Development, Backend Development, Testing & QA, Hosting & Infrastructure, Third-party Tools, Project Management.",
    'scope: one deliverable per main component (4-6 items). Each item: title (max ~5 words) and description (a short 2-line explanation, max ~25 words of what is included).',
    "",
    "subject: what the project is FOR, max 3 words, Title Case, no verbs.",
    'heading: max 6 words, a short title for the whole project (e.g. "Zoo / Wildlife Park Development" or "E-commerce Store for Tuc Shop").',
    "The description often contains typos; infer the intended meaning.",
    'Numbers are allowed ONLY in "pricing", "duration", "components" and "confidence". Everywhere else NEVER output prices, numbers or currency of any kind.',
    "",
    'Example (PHYSICAL project — the amounts below are illustrative only; ALWAYS recompute them from the user\'s location and quantities): input "i want to build a 10 acre zoo with enclosures, animals, a vet clinic and visitor facilities in lahore" -> {"kind":"physical","category":"Zoo / Wildlife Park","projectType":"Zoo / Wildlife Park Development","subject":"10 Acre Zoo","heading":"Zoo / Wildlife Park Development","features":[],"complexity":"Advanced","confidence":0.85,"assumptions":["Land is level, serviced and ready for site works","Wildlife import permits are obtained by you","Animal feed, keepers and utilities are annual operating costs"],"pricing":{"low":380000,"typical":500000,"high":720000},"duration":{"min":14,"max":22,"unit":"months"},"components":[{"name":"Land & Site Preparation","cost":60000,"percentage":12,"note":"Clearing, grading and roads"},{"name":"Enclosures & Habitats","cost":180000,"percentage":36,"note":"Fences, moats and shelters"},{"name":"Animal Acquisition & Transport","cost":90000,"percentage":18,"note":"Buying and shipping the animals"},{"name":"Veterinary Facility","cost":40000,"percentage":8,"note":"Clinic, quarantine and equipment"},{"name":"Staff & Labour","cost":45000,"percentage":9,"note":"Keepers and site crew"},{"name":"Utilities","cost":30000,"percentage":6,"note":"Water, power and waste"},{"name":"Visitor Facilities","cost":25000,"percentage":5,"note":"Ticketing, paths and amenities"},{"name":"Permits & Licenses","cost":12000,"percentage":2.4,"note":"Planning and wildlife approvals"},{"name":"Security","cost":10000,"percentage":2,"note":"Perimeter patrols and cameras"},{"name":"Landscaping","cost":5000,"percentage":1,"note":"Planting and public areas"},{"name":"Marketing & Launch","cost":3000,"percentage":0.6,"note":"Opening campaign and signage"}],"scope":[{"title":"Land and site works","description":"Clearing, grading, access roads, drainage and utilities for the site."},{"title":"Enclosures and habitats","description":"Fencing, moats, shelters and landscaped habitats for every species."},{"title":"Animal acquisition & transport","description":"Sourcing, veterinary checks and safe transport of the animals."},{"title":"Veterinary & back of house","description":"Clinic, quarantine holding, keeper stores and utility rooms."},{"title":"Visitor facilities & launch","description":"Entrance, ticketing, paths, amenities and opening marketing."}]}',
    'Example (SOFTWARE project): input "here i nned to make a tuc shop with online payment" -> {"kind":"software","category":"E-commerce","projectType":"E-commerce Store","subject":"Tuc Shop","heading":"E-commerce Store for Tuc Shop","features":["Online payment"],"complexity":"Standard","confidence":0.9,"assumptions":["You provide product photos and prices","Payment gateway account is set up by you"],"pricing":{"low":8500,"typical":10000,"high":13500},"duration":{"min":6,"max":8,"unit":"weeks"},"components":[{"name":"UI/UX Design","cost":1500,"percentage":15,"note":"Storefront wireframes and styling"},{"name":"Frontend Development","cost":3000,"percentage":30,"note":"Product listing and checkout pages"},{"name":"Backend Development","cost":2500,"percentage":25,"note":"Orders, cart and payment API"},{"name":"Testing & QA","cost":1000,"percentage":10,"note":"Checkout and payment checks"},{"name":"Hosting & Infrastructure","cost":1000,"percentage":10,"note":"First year of hosting"},{"name":"Project Management","cost":1000,"percentage":10,"note":"Coordination and delivery"}],"scope":[{"title":"Product catalog","description":"Categories, variants and product detail pages for the full inventory."},{"title":"Secure payment integration","description":"Card and wallet checkout through a PCI-compliant payment gateway."},{"title":"Order management","description":"Cart, checkout and order tracking screens for customers."},{"title":"Admin dashboard","description":"Manage products, orders and stock from one dashboard."}]}',
  ].join("\n");
}

async function callGroqModel(apiKey, description, model, extraNote) {
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
          { role: "system", content: buildSystemPrompt(extraNote && extraNote.locationLabel) },
          {
            role: "user",
            content: extraNote?.text
              ? `${description}\n\n${extraNote.text}`
              : description,
          },
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
async function callGroq(apiKey, description, extraNote) {
  let lastError = null;
  for (const model of MODEL_CANDIDATES) {
    const { content, modelUnavailable, error } = await callGroqModel(
      apiKey,
      description,
      model,
      extraNote,
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

function sanitizePricing(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const low = Number(value.low);
  const typical = Number(value.typical);
  const high = Number(value.high);
  if (![low, typical, high].every((n) => Number.isFinite(n) && n > 0)) {
    return null;
  }
  if (typical > 5_000_000_000) return null;
  // Keep the AI's own three figures, only fixing an out-of-order range.
  return {
    low: Math.min(low, typical),
    typical,
    high: Math.max(high, typical),
  };
}

function sanitizeDuration(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  let min = Math.round(Number(value.min));
  let max = Math.round(Number(value.max));
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
    return null;
  }
  if (min > max) [min, max] = [max, min];
  const unit = ALLOWED_UNITS.includes(String(value.unit))
    ? String(value.unit)
    : "weeks";
  return { min, max, unit };
}

// Validates and sanitizes the model output. Returns null for invalid output
// (-> 502 bad_ai_output); everything that passes is safe and length-capped.
// Prices are NOT truncated here — they are the real estimate — but they are
// range-checked so a nonsense figure can never reach the UI.
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

  // The AI decides the project type itself: known labels are kept exactly,
  // anything else short and safe is accepted as-is (a zoo does not fit the
  // software list, so we must not force it into one).
  const categoryRaw = capWords(data.category, 4, 40);
  const category = matchAllowed(data.category, ALLOWED_CATEGORIES) || categoryRaw;
  if (!category) return null;
  const projectTypeRaw = capWords(data.projectType, 6, 60);
  const projectType =
    matchAllowed(data.projectType, ALLOWED_PROJECT_TYPES) || projectTypeRaw;
  if (!projectType) return null;

  const kind = ALLOWED_KINDS.includes(String(data.kind))
    ? String(data.kind)
    : null;

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

  const pricing = sanitizePricing(data.pricing);
  const duration = sanitizeDuration(data.duration);

  // Cost components: keep only well-formed entries with a real amount.
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
        .slice(0, 12)
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
    kind,
    category,
    projectType,
    subject,
    heading,
    features: canonicalFeatures,
    complexity,
    confidence,
    assumptions,
    pricing,
    duration,
    components,
    scope,
  };
}

function guessKind(description) {
  const text = String(description || "").toLowerCase();
  if (!PHYSICAL_KEYWORDS.some((pattern) => pattern.test(text))) return null;
  // "park booking website" is still software: only fall back to the physical
  // guess when the text carries no software signal. The model's own `kind`
  // always wins when it is present.
  if (SOFTWARE_KEYWORDS.some((pattern) => pattern.test(text))) return null;
  return "physical";
}

function resolvedKind(sanitized, description) {
  return sanitized.kind || guessKind(description);
}

// True when the answer prices a physical project like a small software job
// (implausibly low total, or a timeline measured in a couple of weeks).
function isImplausibleForPhysical(sanitized, description) {
  if (!sanitized) return false;
  const kind = resolvedKind(sanitized, description);
  if (kind !== "physical") return false;
  const priceTooLow =
    !sanitized.pricing || sanitized.pricing.typical < PHYSICAL_MIN_TYPICAL_USD;
  const timelineTooShort =
    sanitized.duration &&
    sanitized.duration.unit === "weeks" &&
    sanitized.duration.max < PHYSICAL_SHORT_TIMELINE_MAX_WEEKS;
  return priceTooLow || timelineTooShort;
}

// The single re-ask: tell the model exactly what was wrong with its answer and
// to use real-world market prices (and a realistic timeline) this time.
function buildCorrectionNote(sanitized, previousRaw) {
  const lines = [
    "Your previous answer was checked against real-world market costs and is not plausible for this project.",
  ];
  if (
    !sanitized.pricing ||
    sanitized.pricing.typical < PHYSICAL_MIN_TYPICAL_USD
  ) {
    lines.push(
      `You priced it at about $${Math.round(sanitized.pricing?.typical || 0)}, which is far too low. Use real-world market prices for the location: land, materials, construction labour, equipment, permits and professional fees.`,
    );
    lines.push(
      "Physical, construction, land and infrastructure projects typically cost tens of thousands to millions of dollars. Never scale down to fit a small budget. Use the quantities the user gave (acres, animals, floors, rooms, staff) as the main cost drivers, and break the total into the required components.",
    );
  }
  if (
    sanitized.duration &&
    sanitized.duration.unit === "weeks" &&
    sanitized.duration.max < PHYSICAL_SHORT_TIMELINE_MAX_WEEKS
  ) {
    lines.push(
      `You also gave a timeline of ${sanitized.duration.min}-${sanitized.duration.max} weeks, which is too short for a physical build. Give a realistic timeline in months or years.`,
    );
  }
  lines.push("Previous answer:");
  lines.push(String(previousRaw).slice(0, 4000));
  lines.push(
    "Return a corrected answer using the exact same JSON keys, with realistic real-world prices and a realistic timeline.",
  );
  return lines.join("\n\n");
}

// Last-resort guard so a physical build can never be shown as "3-4 weeks":
// when the price is clearly physical but the unit is still weeks, convert to
// months and apply a floor scaled to the size of the job (a $500k build is
// never a 1-month project).
function tightenPhysicalTimeline(sanitized, description) {
  if (!sanitized || !sanitized.duration || !sanitized.pricing) return sanitized;
  if (resolvedKind(sanitized, description) !== "physical") return sanitized;
  if (sanitized.duration.unit !== "weeks") return sanitized;
  if (sanitized.duration.max >= PHYSICAL_SHORT_TIMELINE_MAX_WEEKS) return sanitized;
  const typical = sanitized.pricing.typical;
  if (typical < PHYSICAL_MIN_TYPICAL_USD) return sanitized;
  const minMonths = Math.max(1, Math.round(sanitized.duration.min / 4.345));
  const maxMonths = Math.max(minMonths, Math.round(sanitized.duration.max / 4.345));
  const floor =
    typical >= 1_000_000 ? 12 : typical >= 250_000 ? 6 : typical >= 50_000 ? 3 : 1;
  const min = Math.max(minMonths, floor);
  const max = Math.max(maxMonths, min);
  return { ...sanitized, duration: { min, max, unit: "months" } };
}

export async function POST(request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return jsonError("Too many requests. Please slow down.", 429);
  }

  let description = "";
  let locationId = "";
  try {
    const body = await request.json();
    if (typeof body?.description === "string") {
      description = body.description.trim().slice(0, MAX_INPUT_CHARS);
    }
    if (typeof body?.locationId === "string") {
      locationId = body.locationId.trim().toLowerCase().slice(0, 10);
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

  const userLocation = locationLabel(locationId);
  let { content: raw, model: usedModel } = await callGroq(apiKey, description, {
    locationLabel: userLocation,
  });
  let corrected = false;

  if (raw === null) {
    console.error(
      `[api/analyze] Groq call failed (model=${usedModel ?? MODEL})`,
    );
    console.log(
      `[api/analyze] source=fallback model=${usedModel ?? "none"} responseMs=${Date.now() - startedAt} error=call_failed`,
    );
    return NextResponse.json({
      ...fallbackAnalysis(description),
      source: "fallback",
      model: null,
    });
  }

  let sanitized = sanitizeAiOutput(raw);

  // SANITY CHECK: an implausibly low (or absurdly fast) physical estimate is
  // re-asked ONCE with a note to use real-world market prices.
  if (sanitized && isImplausibleForPhysical(sanitized, description)) {
    const retry = await callGroq(apiKey, description, {
      locationLabel: userLocation,
      text: buildCorrectionNote(sanitized, raw),
    });
    if (retry.content !== null) {
      const retrySanitized = sanitizeAiOutput(retry.content);
      if (retrySanitized) {
        const retryOk =
          !isImplausibleForPhysical(retrySanitized, description) ||
          (retrySanitized.pricing &&
            sanitized.pricing &&
            retrySanitized.pricing.typical > sanitized.pricing.typical);
        if (retryOk) {
          sanitized = retrySanitized;
          usedModel = retry.model ?? usedModel;
          corrected = true;
        }
      }
    }
    if (!corrected) {
      console.warn("[api/analyze] price sanity re-ask did not improve the answer");
    }
  }

  if (!sanitized) {
    console.error("[api/analyze] Invalid model output:", String(raw).slice(0, 300));
    console.log(
      `[api/analyze] source=fallback model=${usedModel} responseMs=${Date.now() - startedAt} error=bad_ai_output`,
    );
    return NextResponse.json({
      ...fallbackAnalysis(description),
      source: "fallback",
      model: null,
    });
  }

  sanitized = tightenPhysicalTimeline(sanitized, description);

  console.log(
    `[api/analyze] source=ai model=${usedModel} responseMs=${Date.now() - startedAt} corrected=${corrected} error=none`,
  );
  return NextResponse.json({ ...sanitized, source: "ai", model: usedModel });
}

// Rule-based analysis used when Groq is unavailable or misbehaving, so the
// client always gets a usable payload (source:fallback). It never invents
// prices — the client prices it from the static config, and the UI labels the
// result as a fallback.
function fallbackAnalysis(description) {
  const analysis = analyzeProject(description);
  return {
    kind: null,
    category: analysis.category,
    projectType: analysis.projectType,
    subject: analysis.subject,
    heading: analysis.heading,
    features: analysis.features,
    complexity: analysis.complexity,
    confidence: analysis.confidence,
    assumptions: analysis.assumptions,
    pricing: null,
    duration: null,
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
