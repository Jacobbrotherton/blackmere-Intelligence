"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, X, MessageSquare } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function DealAnalystChat() {
  const { isPremium, canSearch, incrementSearches } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to Blackmere Intelligence Deal Analyst. I can help you analyse M&A rumours, compare deals, assess regulatory risk, and provide market intelligence. What would you like to explore?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !canSearch) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    if (!isPremium) incrementSearches();

    try {
      const res = await fetch("/api/deal-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }]
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-ft-black text-white rounded-full shadow-2xl hover:bg-ft-black/90 transition-all duration-200 hover:scale-105 border border-white/10"
      >
        <MessageSquare size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 w-[calc(100vw-3rem)] max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "520px" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-ft-black">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-amber-400" />
                <p className="text-white font-semibold text-sm">Blackmere Deal Analyst</p>
                {isPremium && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">PRO</span>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-ft-black" : "bg-amber-500"}`}>
                    {msg.role === "assistant"
                      ? <Bot size={14} className="text-white" />
                      : <User size={14} className="text-white" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "assistant" ? "bg-white border border-gray-200 text-gray-900" : "bg-ft-black text-white"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-ft-black flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {!canSearch && !isPremium ? (
              <div className="p-4 border-t border-gray-100 text-center bg-white">
                <p className="text-gray-500 text-sm mb-2">You have used your 3 free searches today</p>
                <button
                  onClick={() => { setIsOpen(false); window.location.href = "/subscribe"; }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  Upgrade to Premium — £6.99/month
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask about any M&A deal..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 bg-ft-black text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-ft-black/80 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
