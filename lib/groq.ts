// Shared Groq client. Both API routes use this module so the model list,
// timeout and retry behaviour live in exactly one place.
//
// The key is server-only (GROQ_API_KEY) and never leaves this module's caller.

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
// Known-good models used only when the configured model is unavailable (for
// example a stale GROQ_MODEL saved in a host dashboard).
const MODEL_FALLBACKS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const MODEL_CANDIDATES = Array.from(new Set([MODEL, ...MODEL_FALLBACKS]));
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResult {
  content: string | null;
  model: string | null;
  error: string | null;
}

export interface GroqRequest {
  messages: GroqMessage[];
  temperature?: number;
  timeoutMs?: number;
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

async function callModel(
  apiKey: string,
  model: string,
  request: GroqRequest,
): Promise<{ content: string | null; modelUnavailable: boolean; error: string | null }> {
  const timeoutMs = request.timeoutMs ?? 20_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: request.temperature ?? 0,
        response_format: { type: "json_object" },
        messages: request.messages,
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
        `[groq] model ${model} responded ${status}${code ? ` (${code})` : ""}`,
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
        ? `timed out after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[groq] request failed:", message);
    // Network error or timeout: do NOT try another model (that would double
    // the wait). The caller falls back.
    return { content: null, modelUnavailable: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls Groq, trying the configured model first and the known-good fallbacks
 * only when a model is unavailable on the key. Never throws.
 */
export async function callGroq(request: GroqRequest): Promise<GroqResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { content: null, model: null, error: "GROQ_API_KEY missing" };
  }

  let lastError: string | null = null;
  for (const model of MODEL_CANDIDATES) {
    const { content, modelUnavailable, error } = await callModel(
      apiKey,
      model,
      request,
    );
    if (content !== null) {
      if (model !== MODEL) {
        console.warn(
          `[groq] falling back to ${model} (GROQ_MODEL=${MODEL} unavailable)`,
        );
      }
      return { content, model, error: null };
    }
    lastError = error;
    if (!modelUnavailable) break;
  }
  return { content: null, model: null, error: lastError };
}
