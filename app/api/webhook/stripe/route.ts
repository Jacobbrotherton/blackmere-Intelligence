import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  saveSubscription,
  updateSubscriptionStatus,
} from "@/lib/subscription-store";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  console.log(`[webhook] Received event: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const email = session.customer_email ?? session.customer_details?.email;

      if (!email) {
        console.error("[webhook] No email in checkout session");
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const isAnnual = priceId === process.env.STRIPE_ANNUAL_PRICE_ID;

      saveSubscription(email, {
        email,
        customerId,
        subscriptionId,
        plan: isAnnual ? "annual" : "monthly",
        status: "active",
        currentPeriodEnd: (subscription as unknown as Record<string, number>).current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        createdAt: Math.floor(Date.now() / 1000),
      });

      console.log(`[webhook] Premium activated for ${email}`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      updateSubscriptionStatus(invoice.customer as string, "active");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      updateSubscriptionStatus(invoice.customer as string, "past_due");
      console.log(`[webhook] Payment failed for customer ${invoice.customer}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      updateSubscriptionStatus(subscription.customer as string, "cancelled");
      console.log(`[webhook] Subscription cancelled for ${subscription.customer}`);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === "active" ? "active" : "past_due";
      updateSubscriptionStatus(subscription.customer as string, status);
      break;
    }

    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
