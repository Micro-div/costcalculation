import { NextResponse } from "next/server";
import { saveEstimate } from "@/lib/estimateStore";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, {
    scope: "share-save",
    max: 30,
    windowMs: 60_000,
  });
  if (rate.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 },
    );
  }

  let estimate: unknown;
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    estimate = (body as { estimate?: unknown }).estimate;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = await saveEstimate(estimate as never);
  if (!id) {
    return NextResponse.json(
      { error: "The estimate could not be saved." },
      { status: 400 },
    );
  }

  return NextResponse.json({ id });
}
