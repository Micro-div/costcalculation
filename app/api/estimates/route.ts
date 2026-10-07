import { NextResponse } from "next/server";
import { categories } from "@/constants";
import type { CategoryId, ProjectSizeId } from "@/types";

// This project uses `output: "export"`, which does not support dynamic API
// routes. Marking the route static lets the build pass; it remains fully
// functional in `next dev` and server deployments.
export const dynamic = "force-static";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

const VALID_TYPES = new Set<string>(categories.map((category) => category.id));
const VALID_COMPLEXITIES = new Set(["small", "medium", "large"]);

interface Analysis {
  name: string;
  type: CategoryId;
  features: string[];
  complexity: ProjectSizeId;
  summary: string;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function extractJson(text: string): string {
  const cleaned = text
    .trim()
    .replace(/^```[a-zA-Z]*\s*\n?/, "")
    .replace(/\n?\s*```$/, "")
    .trim();
  if (cleaned.startsWith("{")) return cleaned;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return cleaned;
}

function parseAnalysis(text: string): Analysis | null {
  let data: unknown;
  try {
    data = JSON.parse(extractJson(text));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;

  const name =
    typeof obj.name === "string" && obj.name.trim()
      ? obj.name.trim().slice(0, 80)
      : "Custom project";
  const type =
    typeof obj.type === "string" && VALID_TYPES.has(obj.type)
      ? (obj.type as CategoryId)
      : "web";
  const features = Array.isArray(obj.features)
    ? obj.features
        .filter(
          (feature): feature is string =>
            typeof feature === "string" && feature.trim().length > 0,
        )
        .map((feature) => feature.trim().slice(0, 120))
        .slice(0, 12)
    : [];
  const complexity =
    typeof obj.complexity === "string" && VALID_COMPLEXITIES.has(obj.complexity)
      ? (obj.complexity as ProjectSizeId)
      : "medium";
  const summary =
    typeof obj.summary === "string" ? obj.summary.trim().slice(0, 400) : "";

  return { name, type, features, complexity, summary };
}

function extractText(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const candidates = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return null;
  const first = candidates[0] as
    | { content?: { parts?: Array<{ text?: unknown }> } }
    | undefined;
  const text = first?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim() ? text : null;
}

export async function POST(request: Request) {
  let description: unknown;
  try {
    const body: unknown = await request.json();
    description =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).description
        : undefined;
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  if (typeof description !== "string" || !description.trim()) {
    return jsonError("A project description is required.", 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError("AI analysis is not configured on this server.", 500);
  }

  const prompt = [
    "You are a project analysis assistant for a web development agency cost estimator.",
    "The user describes their project in a sentence or two.",
    "Respond with ONLY valid JSON (no markdown, no code fences, no explanation) in this exact shape:",
    '{"name": "A short project title (max 8 words)", "type": "One of: web, mobile, ecommerce, design, seo, social, branding, ai", "features": ["3 to 8 short feature descriptions"], "complexity": "One of: small, medium, large", "summary": "One or two sentences summarizing the project and what it involves."}',
    "",
    `User description: ${description.trim().slice(0, 1000)}`,
  ].join("\n");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
          },
        }),
      },
    );

    if (!res.ok) {
      return jsonError("The AI service returned an error. Please try again.", 502);
    }

    const text = extractText(await res.json());
    if (!text) {
      return jsonError(
        "The AI service returned an empty response. Please try again.",
        502,
      );
    }

    const analysis = parseAnalysis(text);
    if (!analysis) {
      return jsonError("Could not understand the AI response. Please try again.", 502);
    }

    return NextResponse.json(analysis);
  } catch {
    return jsonError("Could not analyze your project. Please try again.", 500);
  }
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
