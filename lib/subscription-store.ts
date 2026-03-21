// In-memory store — resets on server restart
// Replace with Supabase/Postgres in production

export interface SubscriptionRecord {
  email: string;
  customerId: string;
  subscriptionId: string;
  plan: "monthly" | "annual";
  status: "active" | "cancelled" | "past_due";
  currentPeriodEnd: number;
  createdAt: number;
}

const store = new Map<string, SubscriptionRecord>();

export function saveSubscription(email: string, record: SubscriptionRecord) {
  store.set(email.toLowerCase(), record);
}

export function getSubscription(email: string): SubscriptionRecord | null {
  return store.get(email.toLowerCase()) ?? null;
}

export function updateSubscriptionStatus(
  customerId: string,
  status: SubscriptionRecord["status"]
) {
  for (const [email, record] of Array.from(store.entries())) {
    if (record.customerId === customerId) {
      store.set(email, { ...record, status });
      return;
    }
  }
}

export function deleteSubscription(customerId: string) {
  for (const [email, record] of Array.from(store.entries())) {
    if (record.customerId === customerId) {
      store.delete(email);
      return;
    }
  }
}
