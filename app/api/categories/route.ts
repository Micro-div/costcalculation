import { NextResponse } from "next/server";
import { categories, locations } from "@/constants";
import { getCategoryRanges } from "@/lib";

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

  return NextResponse.json({ categories: getCategoryRanges(location) });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
