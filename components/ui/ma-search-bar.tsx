"use client";

import { useRef, useState } from "react";
import { ArrowUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Render markdown-like bold text ────────────────────────────────────────────
function AnswerBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-white/75 text-sm leading-relaxed">
            {parts.map((part, j) => {
              const match = part.match(/^\*\*(.+)\*\*$/);
              return match
                ? <strong key={j} className="text-white font-semibold">{match[1]}</strong>
                : part;
            })}
          </p>
        );
      })}
    </div>
  );
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What is the biggest M&A deal in 2024?",
  "Explain the Paramount Warner Bros merger",
  "What synergies does the Devon Coterra deal create?",
  "What is Merck's strategic rationale for Revolution Medicines?",
];

export function MaSearchBar() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setAsked(trimmed);
    setAnswer("");
    setLoading(true);

    try {
      const res = await fetch("/api/ma-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setAnswer(data.answer ?? "No answer returned.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setAnswer(
        msg.includes("429")
          ? "Today's AI search capacity has been reached. We apologise for the inconvenience — please come back tomorrow when the limit resets."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-3 left-[5%] w-[38%] h-16 rounded-full opacity-70 blur-2xl"
          style={{ background: "radial-gradient(ellipse, #84cc16 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-3 right-[5%] w-[38%] h-16 rounded-full opacity-70 blur-2xl"
          style={{ background: "radial-gradient(ellipse, #3b82f6 0%, transparent 70%)" }}
        />

        {/* Input container */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "#0e0e0e",
            boxShadow:
              "-24px 8px 60px rgba(132, 204, 22, 0.18), 24px 8px 60px rgba(59, 130, 246, 0.18), inset 0 0 0 1px rgba(255,255,255,0.07)",
          }}
        >
          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about any M&A deal, rumour, or company…"
            rows={1}
            className="w-full bg-transparent px-5 pt-4 pb-2 text-white/90 placeholder-white/30 text-sm resize-none outline-none leading-relaxed"
            style={{ minHeight: "52px", maxHeight: "160px", overflowY: "auto", fieldSizing: "content" } as React.CSSProperties}
          />

          {/* Toolbar row */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors text-xs"
            >
              <Zap size={11} />
              M&amp;A Focus
            </button>

            <div className="flex-1" />

            <span className="text-[11px] text-white/20 mr-1">Groq · Llama 3.3</span>

            <button
              type="button"
              onClick={() => submit()}
              disabled={!query.trim() || loading}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors disabled:opacity-30"
              style={{
                background: query.trim() && !loading
                  ? "linear-gradient(135deg, #84cc16, #3b82f6)"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {loading
                ? <div className="w-3 h-3 border border-white/40 border-t-white/80 rounded-full animate-spin" />
                : <ArrowUp size={13} className="text-white" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Suggestions (shown before first search) ───────────────────── */}
      <AnimatePresence>
        {!asked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap gap-2 mt-4 justify-center"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); submit(s); }}
                className="text-xs text-white/35 border border-white/[0.08] rounded-full px-3 py-1.5 hover:text-white/60 hover:border-white/20 transition-colors bg-white/[0.02]"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Answer panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {(answer || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-2xl overflow-hidden"
            style={{
              background: "#0a0a0a",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05]">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: loading
                    ? undefined
                    : "linear-gradient(135deg, #84cc16, #3b82f6)",
                  animation: loading ? "pulse 1.2s ease-in-out infinite" : undefined,
                  backgroundColor: loading ? "#3b82f6" : undefined,
                }}
              />
              <span className="text-white/40 text-xs tracking-wide">
                {loading ? "Researching…" : "Blackmere Intelligence"}
              </span>
              {asked && (
                <span className="ml-auto text-white/20 text-xs truncate max-w-[200px]">
                  "{asked}"
                </span>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {loading && !answer && (
                <div className="space-y-2">
                  {[80, 100, 65, 90, 55].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 rounded animate-pulse bg-white/[0.04]"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              )}
              {answer && <AnswerBody text={answer} />}
              {answer && !loading && (
                <p className="mt-5 text-white/20 text-[11px] italic border-t border-white/[0.04] pt-4">
                  Powered by Groq · llama-3.3-70b · Based on training data — may not reflect the latest developments. Not financial advice.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
