import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Briefings are now hardcoded in lib/briefings.ts and served directly
// by ArticleDrawer without any API call. This stub exists for compatibility.
export async function GET() {
  return NextResponse.json(
    { error: "Briefings are served from hardcoded data — no API required." },
    { status: 404 }
  );
}
