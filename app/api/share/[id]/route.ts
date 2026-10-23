import { NextResponse } from "next/server";
import { getStoredEstimate, isValidShareId } from "@/lib/estimateStore";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidShareId(id)) {
    return NextResponse.json({ error: "Invalid estimate link." }, { status: 400 });
  }

  const estimate = await getStoredEstimate(id);
  if (!estimate) {
    return NextResponse.json(
      { error: "This estimate link is invalid or has expired." },
      { status: 404 },
    );
  }

  return NextResponse.json({ estimate });
}
