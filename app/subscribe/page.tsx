"use client";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, Crown, Loader2 } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";
import { useSearchParams } from "next/navigation";

const FREE_FEATURES = [
  { text: "2 of 17 live rumoured deals", included: true },
  { text: "Live M&A news feed", included: true },
  { text: "Global deal activity map", included: true },
  { text: "Sector filter tabs", included: true },
  { text: "3 AI searches per day", included: true },
  { text: "Deal detail pages (basic)", included: true },
  { text: "All 17 rumoured deals", included: false },
  { text: "Deal probability scores", included: false },
  { text: "Blackmere Deal Analyst Chat", included: false },
  { text: "AI Article Summariser", included: false },
  { text: "Company Deep Dive Reports", included: false },
  { text: "Deal Comparison Engine", included: false },
  { text: "Regulatory Risk Analyser", included: false },
  { text: "Sector Heatmap Dashboard", included: false },
  { text: "Acquisition Premium Calculator", included: false },
  { text: "Watchlist with AI Monitoring", included: false },
  { text: "Deal Timeline Tracker", included: false },
  { text: "Blackmere Morning Brief email", included: false },
  { text: "Ad-free experience", included: false },
];

const PREMIUM_FEATURES = [
  "All 17 live AI-researched rumoured deals",
  "Real-time deal probability scores with rationale",
  "Blackmere Deal Analyst — unlimited AI chat",
  "AI Article Summariser on every article",
  "Company Deep Dive Reports (PDF export)",
  "Deal Comparison Engine",
  "Regulatory Risk Analyser",
  "Sector Heatmap Dashboard",
  "Acquisition Premium Calculator",
  "Watchlist — monitor up to 20 companies",
  "Deal Timeline Tracker",
  "Blackmere Morning Brief daily email",
  "Ad-free experience",
  "Priority access to new features",
];

function SubscribeContent() {
  const { isPremium, email, setEmail, checkSubscription } = useSubscription();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingAnnual, setLoadingAnnual] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [inputEmail, setInputEmail] = useState(email ?? "");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleCheckout = async (plan: "monthly" | "annual") => {
    if (!validateEmail(inputEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setEmail(inputEmail);

    const priceId = plan === "monthly"
      ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID;

    if (!priceId) {
      setEmailError("Payment configuration error — price ID missing. Check NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID in .env.local");
      return;
    }

    plan === "monthly" ? setLoadingMonthly(true) : setLoadingAnnual(true);

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, email: inputEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setEmailError(data.error ?? "Failed to start checkout");
      }
    } catch {
      setEmailError("Network error — please try again");
    } finally {
      setLoadingMonthly(false);
      setLoadingAnnual(false);
    }
  };

  const handlePortal = async () => {
    if (!email) return;
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    } finally {
      setLoadingPortal(false);
    }
  };

  // Re-check subscription on mount in case webhook just fired
  void checkSubscription;

  return (
    <div className="min-h-screen bg-[#030303]">
      <div className="px-4 pt-5">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white transition-colors font-semibold">
          ← Back
        </a>
      </div>

      <div className="border-b border-white/[0.06] py-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {cancelled && (
            <div className="max-w-md mx-auto mb-6 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm">
              Checkout cancelled — no charge was made.
            </div>
          )}
          <p className="text-xs uppercase tracking-widest text-white/30 mb-3">Blackmere Intelligence</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
            Unlock institutional-grade M&A intelligence. One subscription. Cancel anytime.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">

        {/* Email input — shown when not premium */}
        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mb-10">
            <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Your email address</label>
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => { setInputEmail(e.target.value); setEmailError(""); }}
              placeholder="you@example.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-white/30 transition-colors"
            />
            {emailError && <p className="text-red-400 text-xs mt-2">{emailError}</p>}
            <p className="text-white/20 text-xs mt-2">Used to activate your subscription after payment</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8"
          >
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-white/40" />
                <h2 className="text-xl font-bold text-white">Free</h2>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">£0</span>
                <span className="text-white/30 ml-2 text-sm">/ forever</span>
              </div>
              <p className="text-white/30 text-sm mt-2">Get started with core M&A intelligence</p>
            </div>
            <button disabled className="w-full py-3 rounded-xl border border-white/10 text-white/30 font-semibold mb-8 cursor-not-allowed text-sm">
              {isPremium ? "Free Plan" : "Current Plan"}
            </button>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  {f.included
                    ? <Check size={15} className="text-white/70 mt-0.5 shrink-0" />
                    : <X size={15} className="text-white/15 mt-0.5 shrink-0" />}
                  <span className={`text-sm ${f.included ? "text-white/70" : "text-white/20"}`}>{f.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-white border border-white rounded-2xl p-8 overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <span className="bg-[#030303] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={18} className="text-[#030303]" />
                <h2 className="text-xl font-bold text-[#030303]">Premium</h2>
              </div>
              <div className="mb-4">
                <div className="mb-2">
                  <span className="text-5xl font-bold text-[#030303]">£6.99</span>
                  <span className="text-black/40 ml-2 text-sm">/ month</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-black/[0.06] border border-black/10 rounded-full px-3 py-1">
                  <span className="text-black/60 text-xs font-semibold">Or £50/year — save £33.88</span>
                </div>
              </div>
              <p className="text-black/50 text-sm">Full institutional-grade M&A intelligence</p>
            </div>

            {isPremium ? (
              <div className="space-y-3 mb-8">
                <div className="w-full py-3 rounded-xl text-center font-bold bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
                  ✦ You are on Premium
                </div>
                <button
                  onClick={handlePortal}
                  disabled={loadingPortal}
                  className="w-full py-2 rounded-xl border border-black/20 text-black/50 hover:text-black hover:border-black/40 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {loadingPortal
                    ? <><Loader2 size={14} className="animate-spin" /> Loading...</>
                    : "Manage subscription →"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                <button
                  onClick={() => handleCheckout("monthly")}
                  disabled={loadingMonthly || loadingAnnual}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-[#030303] text-white hover:bg-black/80 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingMonthly
                    ? <><Loader2 size={16} className="animate-spin" /> Redirecting to Stripe...</>
                    : "✦ Subscribe Monthly — £6.99/mo"}
                </button>
                <button
                  onClick={() => handleCheckout("annual")}
                  disabled={loadingMonthly || loadingAnnual}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-black/[0.06] border border-black/15 text-black/70 hover:bg-black/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingAnnual
                    ? <><Loader2 size={16} className="animate-spin" /> Redirecting to Stripe...</>
                    : "✦ Subscribe Annually — £50/yr (Best Value)"}
                </button>
              </div>
            )}

            <ul className="space-y-3">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={15} className="text-[#030303] mt-0.5 shrink-0" />
                  <span className="text-black/70 text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-white/20 text-sm mb-4">Secure payments powered by Stripe</p>
          <div className="flex flex-wrap justify-center gap-8 text-white/15 text-xs uppercase tracking-widest">
            <span>🔒 256-bit SSL Encryption</span>
            <span>↩ Cancel Anytime</span>
            <span>⚡ Powered by Groq AI</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribeContent />
    </Suspense>
  );
}
