"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/lib/subscription-context";
import { useAuth } from "@/lib/auth-context";
import { Crown, ChevronDown, LogOut, User, Zap, X, Eye, EyeOff } from "lucide-react";

// ── Auth modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = mode === "login"
      ? await login(email, password)
      : await register(name, email, password);
    setLoading(false);
    if (result.error) setError(result.error);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Blackmere Intelligence</p>
          <h2 className="text-white font-bold text-2xl">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-white/40 text-xs block mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>
          )}
          <div>
            <label className="text-white/40 text-xs block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-white/30 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-white/40 text-xs block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-[#030303] font-bold rounded-xl text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-white hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Main dropdown button ──────────────────────────────────────────────────────
export default function UpgradeNavButton() {
  const { isPremium, setPlan } = useSubscription();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : null;

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#030303] border border-white/10 hover:bg-black transition-colors"
        >
          {user ? (
            <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </span>
          ) : (
            <User size={14} className="text-white/60" />
          )}
          <span className="text-white/70 text-xs font-medium hidden sm:block">
            {user ? user.name.split(" ")[0] : "Account"}
          </span>
          {isPremium && <Crown size={11} className="text-white/60" />}
          <ChevronDown size={12} className="text-white/40" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
            {user ? (
              <>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-white/30 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 font-semibold">
                        <Crown size={10} /> Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40">
                        <Zap size={10} /> Free tier
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2">
                  {!isPremium && (
                    <button
                      onClick={() => { setOpen(false); router.push("/subscribe"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <Crown size={15} className="text-white/60" />
                      <div>
                        <p className="text-white text-sm font-semibold">Upgrade to Premium</p>
                        <p className="text-white/30 text-xs">£6.99/month — unlock everything</p>
                      </div>
                    </button>
                  )}
                  {isPremium && (
                    <button
                      onClick={() => { setPlan("free"); setOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <Zap size={15} className="text-white/30" />
                      <p className="text-white/50 text-sm">Switch to Free</p>
                    </button>
                  )}
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
                  >
                    <LogOut size={15} className="text-white/30" />
                    <p className="text-white/50 text-sm">Sign out</p>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <p className="text-white font-semibold text-sm">Blackmere Intelligence</p>
                  <p className="text-white/30 text-xs mt-0.5">Sign in to manage your account</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setShowAuth(true); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
                  >
                    <User size={15} className="text-white/60" />
                    <p className="text-white text-sm font-semibold">Sign in / Register</p>
                  </button>
                  <button
                    onClick={() => { setOpen(false); router.push("/subscribe"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
                  >
                    <Crown size={15} className="text-white/60" />
                    <div>
                      <p className="text-white text-sm font-semibold">Upgrade to Premium</p>
                      <p className="text-white/30 text-xs">£6.99/month</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
