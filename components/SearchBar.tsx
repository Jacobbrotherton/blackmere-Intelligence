"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Article, getSector, timeAgo } from "@/lib/news";

function openArticle(article: Article) {
  window.dispatchEvent(new CustomEvent("ft:open-article", { detail: article }));
}

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCollapse();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleExpand() {
    setIsExpanded(true);
  }

  function handleCollapse() {
    setIsExpanded(false);
    setQuery("");
    setResults([]);
    setOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.articles ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(val), 320);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") handleCollapse();
  }

  function handleResultClick(article: Article) {
    handleCollapse();
    openArticle(article);
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ── Collapsed: icon button ── */
          <motion.button
            key="icon"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={handleExpand}
            aria-label="Open search"
            className="flex h-7 w-7 items-center justify-center border border-ft-border bg-white hover:bg-ft-grey hover:border-ft-teal transition-colors rounded-full"
          >
            <Search className="h-3.5 w-3.5 text-ft-muted" />
          </motion.button>
        ) : (
          /* ── Expanded: animated input ── */
          <motion.div
            key="input"
            initial={{ width: 28, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative"
          >
            <div className="flex items-center bg-white border border-ft-teal rounded-full overflow-hidden shadow-sm h-7">
              <div className="ml-2.5 flex-shrink-0">
                {loading ? (
                  <svg className="w-3.5 h-3.5 text-ft-teal animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Search className="h-3.5 w-3.5 text-ft-teal" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => results.length > 0 && setOpen(true)}
                placeholder="Search deals, companies…"
                autoFocus
                className="flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-ft-muted/60 text-ft-black min-w-0"
              />
              <motion.button
                type="button"
                onClick={handleCollapse}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="mr-1.5 flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-sm hover:bg-ft-grey"
                aria-label="Close search"
              >
                <X className="h-3 w-3 text-ft-muted" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results dropdown ── */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[400px] bg-white border border-ft-border shadow-lg z-50 rounded-sm overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-ft-border bg-ft-cream flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-ft-muted uppercase">
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </span>
              <button onClick={() => setOpen(false)} className="text-ft-muted hover:text-ft-black text-xs">✕</button>
            </div>
            <ul className="max-h-[400px] overflow-y-auto divide-y divide-ft-border">
              {results.map((article) => {
                const sector = getSector(article.title, article.description);
                return (
                  <li key={article.url}>
                    <button
                      className="w-full text-left px-3 py-3 hover:bg-ft-grey transition-colors group flex gap-3 items-start"
                      onClick={() => handleResultClick(article)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold tracking-widest text-ft-red uppercase">{sector}</span>
                          <span className="text-[10px] text-ft-muted">
                            {article.source.name} · {timeAgo(article.publishedAt)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold font-display leading-snug text-ft-black group-hover:text-ft-teal transition-colors line-clamp-2">
                          {article.title}
                        </p>
                        {article.description && (
                          <p className="text-[11px] text-ft-muted mt-0.5 line-clamp-2 leading-relaxed">
                            {article.description}
                          </p>
                        )}
                      </div>
                      <span className="text-ft-teal text-xs mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="px-3 py-1.5 border-t border-ft-border bg-ft-cream">
              <p className="text-[10px] text-ft-muted">Live news feed · updates every 5 min</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── No results ── */}
      <AnimatePresence>
        {open && !loading && query.trim().length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white border border-ft-border shadow-lg z-50 rounded-sm px-4 py-3"
          >
            <p className="text-xs text-ft-muted">
              No deals found for <span className="font-semibold text-ft-black">&ldquo;{query}&rdquo;</span>
            </p>
            <p className="text-[11px] text-ft-muted mt-1">Try a company name, sector, or deal keyword.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
