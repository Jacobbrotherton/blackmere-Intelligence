import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Article summarisation via Groq has been removed.
// Briefings are now hardcoded in lib/briefings.ts.
export async function POST() {
  return NextResponse.json({ error: "Summarisation not available" }, { status: 404 });
}
