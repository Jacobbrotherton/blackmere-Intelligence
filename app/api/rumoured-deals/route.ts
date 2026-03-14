import { NextResponse } from "next/server";
import { getLiveDeals } from "@/lib/live-deals";

export async function GET() {
  const deals = await getLiveDeals();
  return NextResponse.json(
    { deals },
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600" } }
  );
}
