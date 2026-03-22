import { NextRequest, NextResponse } from "next/server";
import { getSubscription } from "@/lib/subscription-store";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ isPremium: false });
  }

  const record = await getSubscription(email);

  if (!record) {
    return NextResponse.json({ isPremium: false });
  }

  const isActive =
    record.status === "active" &&
    record.currentPeriodEnd > Date.now() / 1000;

  return NextResponse.json({
    isPremium: isActive,
    plan: record.plan,
    status: record.status,
    currentPeriodEnd: record.currentPeriodEnd,
    customerId: record.customerId,
  });
}
