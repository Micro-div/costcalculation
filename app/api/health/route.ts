import { NextResponse } from "next/server";
import { PRICING_META } from "@/constants";
import {
  isUpstashConfigured,
  warnIfUpstashMissingInProduction,
} from "@/lib/upstashConfig";

export const dynamic = "force-dynamic";

// Config-only health check. It deliberately does NOT call Groq: a health
// endpoint must be cheap, cacheable and safe to hit from uptime monitors.
// Missing configuration is reported, not exercised.
export async function GET() {
  warnIfUpstashMissingInProduction();
  const sharedStorageConfigured = isUpstashConfigured();
  const checks = {
    groqKeyPresent: Boolean(process.env.GROQ_API_KEY),
    upstashConfigured: sharedStorageConfigured,
    sharedStorageConfigured,
  };

  const configured = checks.groqKeyPresent;
  return NextResponse.json(
    {
      ok: configured,
      checks,
      pricingUpdatedAt: PRICING_META.lastPricingUpdate,
      // The AI is optional: the app falls back to the rule-based analyzer.
      aiMode: configured ? "groq" : "unavailable",
    },
    { status: configured ? 200 : 503 },
  );
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
