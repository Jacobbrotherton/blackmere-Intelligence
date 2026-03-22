"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Plan = "free" | "premium";

interface SubscriptionContextType {
  plan: Plan;
  email: string | null;
  setEmail: (email: string) => void;
  setPlan: (plan: Plan) => void;
  isPremium: boolean;
  freeSearchesUsed: number;
  incrementSearches: () => void;
  canSearch: boolean;
  checkSubscription: (email: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>("free");
  const [email, setEmailState] = useState<string | null>(null);
  const [freeSearchesUsed, setFreeSearchesUsed] = useState(0);
  const FREE_SEARCH_LIMIT = 3;

  const checkSubscription = async (emailToCheck: string) => {
    try {
      const res = await fetch(
        `/api/subscription/status?email=${encodeURIComponent(emailToCheck)}`
      );
      const data = await res.json();
      if (data.isPremium) {
        setPlan("premium");
        setEmailState(emailToCheck);
      }
    } catch {
      // Silently fail — user stays on free plan
    }
  };

  useEffect(() => {
    // Check subscription whenever Supabase auth session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionEmail = session?.user?.email;
      if (sessionEmail) {
        setEmailState(sessionEmail);
        checkSubscription(sessionEmail);
      } else {
        setEmailState(null);
        setPlan("free");
      }
    });

    // Also check on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionEmail = session?.user?.email;
      if (sessionEmail) {
        setEmailState(sessionEmail);
        checkSubscription(sessionEmail);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setEmail = (newEmail: string) => {
    setEmailState(newEmail);
    checkSubscription(newEmail);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        email,
        setEmail,
        setPlan,
        isPremium: plan === "premium",
        freeSearchesUsed,
        incrementSearches: () => setFreeSearchesUsed((p) => p + 1),
        canSearch: plan === "premium" || freeSearchesUsed < FREE_SEARCH_LIMIT,
        checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
