import { NextResponse } from "next/server";

// Dynamic server route: runs on Vercel / any Node server. Uses the same
// GROQ_API_KEY as POST /api/analyze.
export const dynamic = "force-dynamic";

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MODEL_FALLBACKS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const MODEL_CANDIDATES = Array.from(new Set([MODEL, ...MODEL_FALLBACKS]));
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function GET() {
  const groqKeyPresent = Boolean(process.env.GROQ_API_KEY);

  if (!groqKeyPresent) {
    return NextResponse.json({
      groqKeyPresent: false,
      groqApiWorking: false,
      model: MODEL,
      error: "GROQ_API_KEY is not set",
    });
  }

  // Tiny test call to confirm the key + model actually work end to end.
  const apiKey = process.env.GROQ_API_KEY as string;
  let lastError = "unknown";
  for (const model of MODEL_CANDIDATES) {
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
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (res.ok) {
        return NextResponse.json({
          groqKeyPresent: true,
          groqApiWorking: true,
          model,
        });
      }
      lastError = `HTTP ${res.status} for model ${model}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    groqKeyPresent: true,
    groqApiWorking: false,
    model: MODEL,
    error: lastError,
  });
}
