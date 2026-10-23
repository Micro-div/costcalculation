import { NextResponse } from "next/server";
import { analyzeProject } from "@/lib/analyzeProject";
import {
  ALLOWED_COMPLEXITY,
  ALLOWED_FEATURES,
  ALLOWED_KINDS,
  MAX_DESCRIPTION_CHARS,
  resolveKnownLocation,
  sanitizeAiResponse,
} from "@/lib/analysisSchema";
import { callGroq, isGroqConfigured } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// The model EXTRACTS requirements. It is deliberately never shown a price
// table, a budget range or an example amount, so it cannot anchor on one.
// The user's description and location are sent as USER messages — never
// interpolated into this system prompt.
const SYSTEM_PROMPT = [
  "You extract project requirements for a cost estimator used by a digital and physical services agency.",
  "You NEVER estimate, guess or mention prices, budgets, rates, timelines or confidence scores. A separate rule-based engine prices every project.",
  "LANGUAGE: Write every prose field in the SAME LANGUAGE as the user's description (English, Roman Urdu, Urdu, Hindi, Spanish, French, Arabic...). Keep the JSON keys in English.",
  "",
  "CLARITY CHECK (do this first):",
  '- status "needs_info": the description is ONLY a business or brand name (e.g. "Nike", "Al-Noor") or a bare business type with no specifics — no location, size, quantity, feature or deliverable (e.g. "shop", "tuck shop", "website"). Return NO project details.',
  '- status "ok": the description says what the project is AND gives at least one concrete detail beyond the type — a location, a size, a quantity, a feature or a deliverable.',
  "When unsure, choose needs_info. Never invent details the user did not give.",
  "",
  "Return ONLY a valid JSON object and nothing else.",
  "",
  'If status is "needs_info", return exactly:',
  '{ "status": "needs_info", "understood": string, "questions": string[] }',
  "- understood: one line describing what you think the project is.",
  "- questions: 1-2 short questions (under 12 words each) in the user's language. If the location is missing, one must ask which country and city.",
  "",
  'If status is "ok", return exactly:',
  '{ "status": "ok", "understood": string, "projectBrief": string, "kind": string, "category": string, "projectType": string, "subject": string, "heading": string, "features": string[], "complexity": string, "quantities": object, "locationHint": string, "assumptions": string[], "scope": [{"title": string, "description": string}] }',
  "",
  `kind: exactly one of ${ALLOWED_KINDS.join(" | ")}. "physical" for anything built on land (construction, fit-out, infrastructure, venues, farms, animals, utilities), "software" for code, apps and websites, "service" for design, branding and marketing.`,
  'category: a short label (max 4 words), e.g. "Zoo / Wildlife Park", "Interior & Fit-Out", "Road Construction".',
  'projectType: a precise label (max 6 words), e.g. "Zoo / Wildlife Park Development".',
  `features: use [] when none apply. Otherwise only values from: ${ALLOWED_FEATURES.join(" | ")}`,
  `complexity: exactly one of ${ALLOWED_COMPLEXITY.join(" | ")}.`,
  "quantities: an object with only the numeric quantities the user actually stated. Allowed keys: acres, rooms, floors, units, animals, squareMeters, kilometers, staff. Omit the key when it was not stated. Never convert currencies or invent a quantity.",
  "locationHint: the city/country the user mentioned, or an empty string.",
  "assumptions: up to 5 short, project-specific assumptions (each under 16 words), or [].",
  "scope: 4-6 deliverables. Each item has title (max 8 words) and description (max 25 words).",
  "heading: max 6 words, a short title for the whole project.",
  "subject: what the project is FOR, max 3 words, Title Case, no verbs.",
  "",
  "Every field is text or a stated quantity. If you are about to write a price, time estimate or confidence value, omit it completely.",
].join("\n");

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

// Rule-based extraction used when Groq is unavailable. It contains no prices
// either — the same rule engine prices the result. The client shows an
// explicit "AI unavailable" note when source is "fallback".
function fallbackAnalysis(description: string) {
  const analysis = analyzeProject(description);
  return {
    status: "ok" as const,
    understood: "",
    projectBrief: "",
    kind: analysis.kind,
    category: analysis.category,
    projectType: analysis.projectType,
    subject: analysis.subject,
    heading: analysis.heading,
    features: analysis.features,
    complexity: analysis.complexity,
    quantities: {},
    locationHint: "",
    assumptions: analysis.assumptions,
    scope: analysis.scope,
    source: "fallback" as const,
    model: null,
  };
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, {
    scope: "analyze",
    max: 10,
    windowMs: 60_000,
  });
  if (rate.limited) {
    return jsonError("Too many requests. Please slow down.", 429);
  }

  let description = "";
  let locationId = "";
  let locationText = "";
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.", 400);
    }
    const record = body as Record<string, unknown>;
    if (typeof record.description === "string") {
      description = record.description.trim().slice(0, MAX_DESCRIPTION_CHARS);
    }
    if (typeof record.locationId === "string") {
      locationId = record.locationId.trim().toLowerCase().slice(0, 40);
    }
    if (typeof record.location === "string") {
      locationText = record.location;
    }
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  if (!description) {
    return jsonError("A project description is required.", 400);
  }

  // Only a real city from our list is ever forwarded to the model.
  const knownLocation = resolveKnownLocation(locationId, locationText);

  if (!isGroqConfigured()) {
    return NextResponse.json(fallbackAnalysis(description));
  }

  const userMessage = [
    "Project description:",
    '"""',
    description,
    '"""',
    "",
    `Pricing location: ${knownLocation || "not provided"}`,
  ].join("\n");

  const result = await callGroq({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0,
    timeoutMs: 20_000,
  });

  if (result.content === null) {
    return NextResponse.json(fallbackAnalysis(description));
  }

  const parsed = sanitizeAiResponse(result.content);
  if (!parsed) {
    console.error(
      "[api/analyze] invalid model output:",
      result.content.slice(0, 300),
    );
    return NextResponse.json(fallbackAnalysis(description));
  }

  if (parsed.status === "needs_info") {
    return NextResponse.json(parsed);
  }

  return NextResponse.json({
    ...parsed,
    source: "ai" as const,
    model: result.model,
  });
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
