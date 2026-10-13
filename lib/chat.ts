// Client-side helper for the chatbot (POST /api/chat).
// - Never touches GROQ_API_KEY and never calls Groq directly; only our route.
// - Any failure (network, timeout, non-200, invalid JSON) resolves to the
//   shared rule-based fallback, so the chat keeps working fully offline.

import { buildLocalReply, type ChatReply, type ChatTurn } from "@/lib/chatFallback";

const REQUEST_TIMEOUT_MS = 25000;

function isValidReply(value: unknown): value is ChatReply {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<ChatReply>;
  return (
    typeof v.reply === "string" &&
    v.reply.trim().length > 0 &&
    typeof v.suggestEstimate === "boolean" &&
    typeof v.brief === "string"
  );
}

// Small promise-based pause, used to keep the "thinking" state visible long
// enough for the answer to feel considered rather than instant.
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function requestChatReply(
  turns: ChatTurn[],
  locationLabel = "",
  activeBrief = "",
): Promise<ChatReply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: turns,
        ...(locationLabel ? { location: locationLabel } : {}),
        // The brief of the estimate the user already has, so the model can
        // apply a requested change and return an updated brief.
        ...(activeBrief ? { activeBrief } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[chat] /api/chat failed: HTTP ${res.status}`);
      return buildLocalReply(turns, locationLabel);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      console.warn("[chat] /api/chat returned a non-JSON response");
      return buildLocalReply(turns, locationLabel);
    }
    const data: unknown = await res.json();
    if (!isValidReply(data)) {
      console.warn("[chat] /api/chat returned an invalid payload");
      return buildLocalReply(turns, locationLabel);
    }
    return {
      reply: data.reply,
      suggestEstimate: data.suggestEstimate && Boolean(data.brief),
      brief: data.brief,
      source: data.source === "ai" ? "ai" : "fallback",
      model: data.model ?? null,
    };
  } catch (err) {
    console.warn(
      "[chat] request failed:",
      err instanceof Error ? err.message : String(err),
    );
    return buildLocalReply(turns, locationLabel);
  } finally {
    clearTimeout(timer);
  }
}
