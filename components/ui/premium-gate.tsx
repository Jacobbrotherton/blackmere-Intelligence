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
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-[2px] rounded-2xl cursor-pointer"
          onClick={() => router.push("/subscribe")}
        >
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
            <Lock size={20} className="text-amber-400" />
          </div>
          <p className="text-white font-bold text-sm mb-1">{label}</p>
          <p className="text-white/40 text-xs mb-4">Upgrade to unlock unlimited access</p>
          <button className="px-5 py-2 rounded-xl font-bold text-sm bg-white text-[#030303] hover:bg-white/90 transition-all">
            Upgrade — £6.99/month
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-700 rounded-2xl cursor-pointer hover:border-zinc-600 transition-colors"
      onClick={() => router.push("/subscribe")}
    >
      <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
        <Lock size={20} className="text-amber-400" />
      </div>
      <p className="text-white font-bold mb-1">{label}</p>
      <p className="text-white/40 text-sm mt-1 mb-4">Available on Premium — Upgrade for £6.99/month</p>
      <button className="px-5 py-2 rounded-xl font-bold text-sm bg-white text-[#030303] hover:bg-white/90 transition-all">
        Upgrade to Premium
      </button>
    </div>
  );
}
