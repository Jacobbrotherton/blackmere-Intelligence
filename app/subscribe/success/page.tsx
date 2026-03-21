"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";

export default function SuccessPage() {
  const router = useRouter();
  const { checkSubscription, email } = useSubscription();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Suppress unused warning — session_id is for future server-side verification
  void searchParams.get("session_id");

  useEffect(() => {
    const activate = async () => {
      // Give webhook 2 seconds to process before checking status
      await new Promise((r) => setTimeout(r, 2000));
      if (email) await checkSubscription(email);
      setLoading(false);
    };
    activate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-2xl p-10 text-center"
      >
        {loading ? (
          <>
            <Loader2 size={48} className="animate-spin text-white/40 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Activating your subscription...</h1>
            <p className="text-white/40 text-sm">Please wait while we confirm your payment</p>
          </>
        ) : (
          <>
            <CheckCircle size={56} className="text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-3">Welcome to Premium!</h1>
            <p className="text-white/50 mb-8 leading-relaxed text-sm">
              Your Blackmere Intelligence Premium subscription is now active.
              You have full access to all AI-powered features.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/stock-analysis")}
                className="w-full py-3 bg-white text-[#030303] rounded-xl font-bold hover:bg-white/90 transition-colors text-sm"
              >
                Explore Stock Analysis →
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 border border-white/10 text-white/50 rounded-xl font-semibold hover:bg-white/[0.04] transition-colors text-sm"
              >
                Go to homepage
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
