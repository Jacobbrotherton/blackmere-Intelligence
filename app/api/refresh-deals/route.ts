import { NextResponse } from "next/server";
import { rumouredDeals } from "@/lib/rumoured-deals";

export async function GET() {
  return NextResponse.json({
    deals: rumouredDeals,
    lastRefreshed: new Date().toISOString(),
    fromCache: false,
  });
}
