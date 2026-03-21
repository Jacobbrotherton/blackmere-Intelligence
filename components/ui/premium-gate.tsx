"use client";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";

interface PremiumGateProps {
  children: React.ReactNode;
  blur?: boolean;
  label?: string;
}

export function PremiumGate({ children, blur = true, label = "Premium Feature" }: PremiumGateProps) {
  const { isPremium } = useSubscription();
  const router = useRouter();

  // Bypass gate in local development so all features are testable
  const isDev = process.env.NODE_ENV === "development";
  if (isPremium || isDev) return <>{children}</>;

  if (blur) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-60">
          {children}
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] rounded-lg cursor-pointer"
          onClick={() => router.push("/subscribe")}
        >
          <Lock size={20} className="text-ft-black mb-2" />
          <p className="text-ft-black font-semibold text-sm">{label}</p>
          <p className="text-ft-black/60 text-xs mt-1">Upgrade to Premium →</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => router.push("/subscribe")}
    >
      <Lock size={24} className="text-ft-black/40 mb-3" />
      <p className="text-ft-black font-semibold">{label}</p>
      <p className="text-ft-black/50 text-sm mt-1">Available on Premium — Upgrade for £6.99/month</p>
    </div>
  );
}
