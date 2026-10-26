import { NextResponse } from "next/server";
import { categories, locations } from "@/constants";
import { calculateEstimate, formatCompactCurrency } from "@/lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const location = locations.find((item) => item.id === "us");
  if (!location) {
    console.error("[api/categories] default pricing location is missing");
    return NextResponse.json(
      { error: "Category ranges are unavailable right now." },
      { status: 500 },
    );
  }

  const ranges = categories.map((category) => {
    const estimate = calculateEstimate(
      category.example,
      category.id,
      location.id,
      "medium",
      "standard",
    );
    return {
      id: category.id,
      range: `${formatCompactCurrency(estimate.low, estimate.location)} – ${formatCompactCurrency(estimate.high, estimate.location)}`,
    };
  });

  return NextResponse.json({ categories: ranges });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
