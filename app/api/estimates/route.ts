import { NextResponse } from "next/server";
import { categories } from "@/constants";
import type { CategoryId, ProjectSizeId } from "@/types";

// Dynamic server route: runs on Vercel / any Node server. Uses the same
// GROQ_API_KEY as POST /api/analyze (set it in Vercel → Settings →
// Environment Variables, or in .env.local for local development).

const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
// Fallback models used only if the configured one is unavailable on the key.
const MODEL_FALLBACKS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const MODEL_CANDIDATES = Array.from(new Set([MODEL, ...MODEL_FALLBACKS]));
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const VALID_TYPES = new Set<string>(categories.map((category) => category.id));
const VALID_COMPLEXITIES = new Set(["small", "medium", "large"]);

export const dynamic = "force-dynamic";

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
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const first = choices[0] as
    | { message?: { content?: unknown } }
    | undefined;
  const text = first?.message?.content;
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError("AI analysis is not configured on this server.", 500);
  }

  const prompt = [
    "You are a project analysis assistant for a web development agency cost estimator.",
    "The user describes their project in a sentence or two.",
    "Respond with ONLY valid JSON (no markdown, no code fences, no explanation) in this exact shape:",
    '{"name": "A short project title (max 8 words)", "type": "One of: web, mobile, ecommerce, design, seo, social, branding, ai", "features": ["3 to 8 short feature descriptions"], "complexity": "One of: small, medium, large", "summary": "One or two sentences summarizing the project and what it involves."}',
  ].join("\n");

  try {
    let text: string | null = null;
    for (const model of MODEL_CANDIDATES) {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: description.trim().slice(0, 1000) },
          ],
        }),
      });

      if (!res.ok) {
        console.error(
          `[api/estimates] Groq responded ${res.status} for model ${model}`,
        );
        continue;
      }

      text = extractText(await res.json());
      if (text) break;
    }

    if (!text) {
      return jsonError("The AI service returned an error. Please try again.", 502);
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
