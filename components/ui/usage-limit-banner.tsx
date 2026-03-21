"use client";
import { Lock, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface UsageLimitBannerProps {
  feature: string;
}

export function UsageLimitBanner({ feature }: UsageLimitBannerProps) {
  const router = useRouter();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const resetsAt = tomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">
      <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-full mx-auto mb-4">
        <Lock size={20} className="text-amber-400" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">Daily Limit Reached</h3>
      <p className="text-white/50 text-sm mb-1">
        You have used your free daily {feature} access.
      </p>
      <p className="text-white/30 text-xs mb-6">
        Resets at midnight · Tomorrow at {resetsAt}
      </p>
      <div className="space-y-3">
        <button
          onClick={() => router.push('/subscribe')}
          className="w-full py-3 rounded-xl font-bold text-sm bg-white text-[#030303] hover:bg-white/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <TrendingUp size={16} />
          Upgrade for Unlimited Access — £6.99/month
        </button>
        <p className="text-white/20 text-xs">
          Premium subscribers get unlimited {feature} access
        </p>
      </div>
    </div>
  );
}
