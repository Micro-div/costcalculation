import { NextResponse } from "next/server";
import { buildLocalReply, type ChatTurn } from "@/lib/chatFallback";

export const dynamic = "force-dynamic";

// Server route for the chatbot. Requires the same GROQ_API_KEY as
// /api/analyze (set it in .env.local for local development, or in your host's
// environment variables). The key never reaches the browser.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
// Models known to be available on Groq's current free/standard keys, used only
// when the configured model is unavailable, so the chat keeps working.
const MODEL_FALLBACKS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const MODEL_CANDIDATES = Array.from(new Set([MODEL, ...MODEL_FALLBACKS]));
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_MESSAGE_CHARS = 1200;
const MAX_TURNS = 14;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Same lightweight per-IP rate limiter as /api/analyze, so a runaway client
// can never hammer the Groq quota.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
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

function capText(value: unknown, maxChars: number): string {
  const raw = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return raw.slice(0, maxChars).trim();
}

// Keeps only well-formed user/assistant turns (roles are forced, lengths capped)
// so nothing unexpected ever reaches the model.
function sanitizeTurns(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: ChatTurn[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const role = (item as { role?: unknown }).role;
    const contentRaw = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof contentRaw !== "string") continue;
    const content = capText(contentRaw, MAX_MESSAGE_CHARS);
    if (!content) continue;
    turns.push({ role, content });
  }
  return turns.slice(-MAX_TURNS);
}

function buildSystemPrompt(userLocation: string, activeBrief: string): string {
  const where = userLocation
    ? `The user is pricing the project in: ${userLocation}. Use it when it is relevant.`
    : "No pricing location has been chosen yet. If you need it, ask the user which country and which city before finalising.";
  const existing = activeBrief
    ? `The user ALREADY has an estimate for this brief: "${activeBrief}"${userLocation ? ` in ${userLocation}` : ""}. If they ask for any change (size, quantity, features, budget, location), produce a NEW brief that merges the original project with their change, and set suggestEstimate to true even for a small change.`
    : "The user does not have an estimate yet.";
  return [
    "You are the CostCalc assistant, a friendly project cost-estimating helper embedded in a website.",
    "Your job: chat briefly with the user, understand what they want to build, and help them get a cost estimate.",
    "",
    "RULES",
    "- ALWAYS reply in the SAME LANGUAGE as the user's latest message (English, Roman Urdu, Urdu, Hindi, Spanish, French, Arabic, etc.). Mirror their language naturally.",
    "- Keep replies short and conversational: 1-3 sentences. Do not use long lists or headings.",
    "- Do NOT invent exact prices or cost figures in the chat. The estimate button prices the project for real.",
    "- Be warm and direct. If the user is just greeting you, greet them back and ask what they want to build.",
    where,
    "",
    "LOCATION",
    "- If the user has not told you where the project is, ask them which country and which city (for example: 'Kis mulk aur kis city mein?').",
    "- A location picker is also shown in the chat header; the user can change it there. When the user names a country or city in their message, treat that as the location.",
    "",
    existing,
    "",
    "DECIDE THE ESTIMATE STATE",
    "- Set suggestEstimate to true when the user has described a project well enough to price: a project type PLUS at least one concrete detail (a size, a quantity, a feature, or a deliverable).",
    "- When suggestEstimate is true, write a tight 1-2 sentence brief that captures the project type, size/quantities, key features and location. This brief is what the estimator will price, so keep it factual and specific. If an existing estimate is being changed, the new brief must include BOTH the original details and the change.",
    "- Set suggestEstimate to false when you still need information (for example the user only gave a name or a bare type). Ask ONE short clarifying question in that case and set brief to an empty string.",
    "- Anything is allowed as a project — physical builds, shops, events, farms, software, services. Never refuse because a project is not in a fixed list.",
    "",
    "Return ONLY a valid JSON object and nothing else, with exactly these keys:",
    '{ "reply": string, "suggestEstimate": boolean, "brief": string }',
    "- reply: your message to the user, in their language.",
    "- suggestEstimate: boolean as described above.",
    "- brief: the pricing brief when suggestEstimate is true, otherwise an empty string.",
  ].join("\n");
}

async function callGroqModel(
  apiKey: string,
  turns: ChatTurn[],
  model: string,
  userLocation: string,
  activeBrief: string,
): Promise<{ content: string | null; modelUnavailable: boolean; error: string | null }> {
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
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(userLocation, activeBrief) },
          ...turns,
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
        `[api/chat] Groq responded ${status} for model ${model}${code ? ` (${code})` : ""}`,
      );
      return {
        content: null,
        modelUnavailable,
        error: `HTTP ${status}${code ? ` (${code})` : ""}`,
      };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return {
      content: typeof content === "string" ? content : null,
      modelUnavailable: false,
      error: typeof content === "string" ? null : "empty model response",
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? `timed out after ${REQUEST_TIMEOUT_MS}ms`
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[api/chat] Groq request failed:", message);
    return { content: null, modelUnavailable: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function callGroq(
  apiKey: string,
  turns: ChatTurn[],
  userLocation: string,
  activeBrief: string,
): Promise<{ content: string | null; model: string | null }> {
  for (const model of MODEL_CANDIDATES) {
    const { content, modelUnavailable } = await callGroqModel(
      apiKey,
      turns,
      model,
      userLocation,
      activeBrief,
    );
    if (content !== null) {
      if (model !== MODEL) {
        console.warn(
          `[api/chat] Falling back to model ${model} (GROQ_MODEL=${MODEL} unavailable)`,
        );
      }
      return { content, model };
    }
    if (!modelUnavailable) return { content: null, model: null };
  }
  return { content: null, model: null };
}

interface ChatPayload {
  reply: string;
  suggestEstimate: boolean;
  brief: string;
}

// Validates and caps the model's JSON so the client always receives a safe
// {reply, suggestEstimate, brief} shape.
function parseChatReply(raw: string): ChatPayload | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const reply = capText((data as { reply?: unknown }).reply, 800);
  if (!reply) return null;
  const suggestEstimate = Boolean(
    (data as { suggestEstimate?: unknown }).suggestEstimate,
  );
  const brief = suggestEstimate
    ? capText((data as { brief?: unknown }).brief, 400)
    : "";
  return { reply, suggestEstimate: suggestEstimate && Boolean(brief), brief };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return jsonError("Too many requests. Please slow down.", 429);
  }

  let turns: ChatTurn[] = [];
  let locationText = "";
  let activeBrief = "";
  try {
    const body = await request.json();
    turns = sanitizeTurns(body?.messages);
    if (typeof body?.location === "string") {
      locationText = capText(body.location, 80);
    }
    if (typeof body?.activeBrief === "string") {
      activeBrief = capText(body.activeBrief, 400);
    }
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const lastUser = [...turns].reverse().find((turn) => turn.role === "user");
  if (!lastUser) {
    return jsonError("A user message is required.", 400);
  }

  // Server-only secret. Never NEXT_PUBLIC_, never used from client code.
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error(
      "[api/chat] GROQ_API_KEY is not set. Add it to .env.local (local) or your host's environment variables.",
    );
    return NextResponse.json(buildLocalReply(turns, locationText));
  }

  const { content, model } = await callGroq(
    apiKey,
    turns,
    locationText,
    activeBrief,
  );
  if (content === null) {
    console.error("[api/chat] Groq call failed — using offline fallback");
    return NextResponse.json(buildLocalReply(turns, locationText));
  }

  const parsed = parseChatReply(content);
  if (!parsed) {
    console.error(
      "[api/chat] Invalid model output:",
      String(content).slice(0, 300),
    );
    return NextResponse.json(buildLocalReply(turns, locationText));
  }

  return NextResponse.json({
    reply: parsed.reply,
    suggestEstimate: parsed.suggestEstimate,
    brief: parsed.brief,
    source: "ai",
    model,
  });
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
