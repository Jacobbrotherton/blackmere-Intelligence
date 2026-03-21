"use client";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export function DailyLimitBanner({ feature }: { feature: string }) {
  const router = useRouter();
  return (
    <div className="text-center py-4">
      <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock size={20} className="text-amber-400" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">Daily Limit Reached</h3>
      <p className="text-white/50 text-sm mb-1">
        Your free daily {feature} access has been used.
      </p>
      <p className="text-white/30 text-xs mb-6">Resets at midnight</p>
      <button
        onClick={() => router.push('/subscribe')}
        className="w-full max-w-xs mx-auto py-3 rounded-xl font-bold text-sm bg-white text-[#030303] hover:bg-white/90 transition-all hover:scale-[1.02] block"
      >
        Upgrade for Unlimited Access — £6.99/month
      </button>
      <p className="text-white/20 text-xs mt-3">Cancel anytime · Instant access</p>
    </div>
  );
}
