import { createAdminClient } from "@/lib/supabase";

export interface SubscriptionRecord {
  email: string;
  customerId: string;
  subscriptionId: string;
  plan: "monthly" | "annual";
  status: "active" | "cancelled" | "past_due";
  currentPeriodEnd: number;
  createdAt: number;
}

export async function saveSubscription(email: string, record: SubscriptionRecord) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("subscriptions").upsert({
    email: email.toLowerCase(),
    customer_id: record.customerId,
    subscription_id: record.subscriptionId,
    plan: record.plan,
    status: record.status,
    current_period_end: record.currentPeriodEnd,
    created_at: record.createdAt,
  });
  if (error) console.error("[subscription-store] saveSubscription:", error.message);
}

export async function getSubscription(email: string): Promise<SubscriptionRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) return null;

  return {
    email: data.email,
    customerId: data.customer_id,
    subscriptionId: data.subscription_id,
    plan: data.plan,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    createdAt: data.created_at,
  };
}

export async function updateSubscriptionStatus(
  customerId: string,
  status: SubscriptionRecord["status"]
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status })
    .eq("customer_id", customerId);
  if (error) console.error("[subscription-store] updateSubscriptionStatus:", error.message);
}

export async function deleteSubscription(customerId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("customer_id", customerId);
  if (error) console.error("[subscription-store] deleteSubscription:", error.message);
}
