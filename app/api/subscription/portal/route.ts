import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSubscription } from "@/lib/subscription-store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const record = getSubscription(email);

    if (!record) {
      return NextResponse.json(
        { error: "No subscription found for this email" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: record.customerId,
      return_url: `${baseUrl}/subscribe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create portal session";
    console.error("[portal] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
