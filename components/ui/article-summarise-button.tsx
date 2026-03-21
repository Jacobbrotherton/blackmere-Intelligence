"use client";
import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";
import { useRouter } from "next/navigation";

interface Props {
  articleTitle: string;
  articleUrl: string;
}

export function ArticleSummariseButton({ articleTitle, articleUrl }: Props) {
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSummarise = async () => {
    if (!isPremium) {
      router.push("/subscribe");
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch("/api/summarise-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: articleTitle, url: articleUrl }),
      });
      const data = await res.json();
      setSummary(data.bullets);
    } catch {
      setSummary(["Failed to summarise article. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleSummarise}
        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
          isPremium
            ? "border-amber-500/30 text-amber-600 bg-amber-50 hover:bg-amber-100"
            : "border-gray-200 text-gray-400 hover:text-gray-600"
        }`}
      >
        <Sparkles size={11} />
        {isPremium ? "AI Summary" : "🔒 AI Summary (Premium)"}
      </button>

      {open && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 relative">
          <button
            onClick={() => { setOpen(false); setSummary(null); }}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
          {loading ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Groq is reading this article...
            </div>
          ) : (
            <ul className="space-y-2">
              {summary?.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-900">
                  <span className="text-amber-500 font-bold shrink-0">•</span>
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
