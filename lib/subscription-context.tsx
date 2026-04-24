"use client";
import { createContext, useContext, ReactNode } from "react";

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

const stub: SubscriptionContextType = {
  plan: "premium",
  email: null,
  setEmail: () => {},
  setPlan: () => {},
  isPremium: true,
  freeSearchesUsed: 0,
  incrementSearches: () => {},
  canSearch: true,
  checkSubscription: async () => {},
};

const SubscriptionContext = createContext<SubscriptionContextType>(stub);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  return <SubscriptionContext.Provider value={stub}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
